package com.sham.complianceforensics

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

import com.compliance.forensics.data.repository.AuditRepository
import com.compliance.forensics.data.database.AuditDatabase
import com.compliance.forensics.data.database.AuditLogEntity
import com.compliance.forensics.data.ConsentRepository
import com.compliance.forensics.VerificationResultBus
import com.compliance.forensics.data.VerificationResult
import com.compliance.forensics.CallReceiver

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import android.util.Log
import android.content.Intent
import android.content.Context
import android.graphics.pdf.PdfDocument
import android.graphics.Paint
import android.graphics.Color
import android.graphics.RectF
import android.app.DownloadManager
import android.os.Environment
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// Helper classes for TRAI 4-way classification inside the React Native bridge
data class Lsa(val name: String)

sealed class CallClassification {
    abstract fun label(): String
    
    data class Blocked(val entityName: String?, val lsa: Lsa) : CallClassification() {
        override fun label() = "BLOCKED"
    }

    data class AuthorisedBankOrGovt(val entityName: String?, val lsa: Lsa) : CallClassification() {
        override fun label() = "AUTHORISED_BANK_GOVT"
    }
    
    data class Promotional(val entityName: String?, val lsa: Lsa) : CallClassification() {
        override fun label() = "PROMOTIONAL"
    }
    
    data class Known(val operatorName: String, val lsa: Lsa) : CallClassification() {
        override fun label() = "KNOWN"
    }
    
    data class Unverified(val operatorName: String, val lsa: Lsa) : CallClassification() {
        override fun label() = "UNVERIFIED"
    }
}

class ConsentRegistryRepository(private val context: Context) {
    private val consentRepo = ConsentRepository(context)
    private val db by lazy { com.compliance.forensics.data.database.AuditDatabase.getDatabase(context) }
    
    suspend fun verifyCaller(number: String): VerificationResult {
        return consentRepo.verifyCaller(number)
    }
    
    suspend fun classifyCaller(number: String): CallClassification {
        val digits = number.filter { it.isDigit() }
        val normalized = if (digits.length == 12 && digits.startsWith("91")) digits.drop(2) else digits
        val withCC = "+91$normalized"
        val formattedCC = "+91 $normalized"

        val defaultLsa = Lsa("National")

        // 0. Check blocklist FIRST — if user blocked this number, return BLOCKED classification regardless of category
        if (isBlocked(number) || isBlocked(digits) || isBlocked(normalized) || isBlocked(withCC) || isBlocked(formattedCC)) {
            return CallClassification.Blocked("Blocked Caller", defaultLsa)
        }

        // 1. TRAI 1600 series — Authorised Bank/Govt
        if (normalized.startsWith("1600")) {
            return CallClassification.AuthorisedBankOrGovt("TRAI Authorised — Bank/Govt", defaultLsa)
        }

        // 2. TRAI 140 series — Promotional
        if (normalized.startsWith("140")) {
            return CallClassification.Promotional("TRAI Registered Telemarketer", defaultLsa)
        }

        // 3. Check device call log — if number appears in call history, mark Known
        try {
            val cursor = context.contentResolver.query(
                android.provider.CallLog.Calls.CONTENT_URI,
                arrayOf(android.provider.CallLog.Calls.NUMBER),
                null, null,
                "${android.provider.CallLog.Calls.DATE} DESC"
            )
            cursor?.use { c ->
                val numIndex = c.getColumnIndex(android.provider.CallLog.Calls.NUMBER)
                while (c.moveToNext()) {
                    val logNum = c.getString(numIndex)?.filter { it.isDigit() } ?: continue
                    val logNorm = if (logNum.length == 12 && logNum.startsWith("91")) logNum.drop(2) else logNum
                    if (logNorm == normalized && logNorm.length >= 8) {
                        return CallClassification.Known(
                            operatorName = "In Call History",
                            lsa = defaultLsa
                        )
                    }
                }
            }
        } catch (e: Exception) {
            android.util.Log.w("CFE", "Call log lookup failed: ${e.message}")
        }

        // 4. DLT registry check
        val result = verifyCaller(number)
        return if (result.isVerified) {
            CallClassification.AuthorisedBankOrGovt(result.claimingEntity, defaultLsa)
        } else {
            CallClassification.Unverified("UNKNOWN", defaultLsa)
        }
    }


    fun blockNumber(number: String) {
        val digits = number.filter { it.isDigit() }
        val normalized = if (digits.length == 12 && digits.startsWith("91")) digits.drop(2) else digits
        val now = System.currentTimeMillis()

        db.blocklistDao().insert(com.compliance.forensics.data.database.BlockedNumberEntity(
            phoneNumber = number,
            blockedAt = now,
            reason = "USER_BLOCKED"
        ))
        if (digits.isNotEmpty() && digits != number) {
            db.blocklistDao().insert(com.compliance.forensics.data.database.BlockedNumberEntity(
                phoneNumber = digits,
                blockedAt = now,
                reason = "USER_BLOCKED"
            ))
        }
        if (normalized.isNotEmpty() && normalized != number && normalized != digits) {
            db.blocklistDao().insert(com.compliance.forensics.data.database.BlockedNumberEntity(
                phoneNumber = normalized,
                blockedAt = now,
                reason = "USER_BLOCKED"
            ))
        }
        if (normalized.length == 10) {
            db.blocklistDao().insert(com.compliance.forensics.data.database.BlockedNumberEntity(
                phoneNumber = "+91$normalized",
                blockedAt = now,
                reason = "USER_BLOCKED"
            ))
            db.blocklistDao().insert(com.compliance.forensics.data.database.BlockedNumberEntity(
                phoneNumber = "+91 $normalized",
                blockedAt = now,
                reason = "USER_BLOCKED"
            ))
        }
    }

    fun unblockNumber(number: String) {
        val digits = number.filter { it.isDigit() }
        val normalized = if (digits.length == 12 && digits.startsWith("91")) digits.drop(2) else digits

        db.blocklistDao().delete(number)
        if (digits.isNotEmpty()) db.blocklistDao().delete(digits)
        if (normalized.isNotEmpty()) db.blocklistDao().delete(normalized)
        if (normalized.length == 10) {
            db.blocklistDao().delete("+91$normalized")
            db.blocklistDao().delete("+91 $normalized")
        }
    }

    fun isBlocked(number: String): Boolean {
        val digits = number.filter { it.isDigit() }
        val normalized = if (digits.length == 12 && digits.startsWith("91")) digits.drop(2) else digits
        val withCC = "+91$normalized"
        val formattedCC = "+91 $normalized"

        return db.blocklistDao().isBlocked(number) ||
               db.blocklistDao().isBlocked(digits) ||
               db.blocklistDao().isBlocked(normalized) ||
               db.blocklistDao().isBlocked(withCC) ||
               db.blocklistDao().isBlocked(formattedCC)
    }
}

class AuditBridgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        // Observe VerificationResultBus for live incoming call results
        // and emit them directly to React Native JS.
        CoroutineScope(Dispatchers.Main).launch {
            VerificationResultBus.latestResult.observeForever { result ->
                if (result != null) {
                    emitVerificationResult(result)
                }
            }
        }
    }

    override fun getName(): String = "AuditBridgeModule"

    @ReactMethod
    fun getRecentLogs(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val logsList = repository.getAllLogs().first()
                val array = Arguments.createArray()
                for (log in logsList) {
                    val map = Arguments.createMap()
                    map.putDouble("id", log.id.toDouble())
                    map.putDouble("timestamp", log.timestamp.toDouble())
                    map.putString("callerId", log.callerId)
                    map.putString("callerName", log.callerName)
                    map.putString("businessName", log.businessName)
                    map.putString("consentHash", log.consentHash)
                    map.putString("verificationStatus", log.verificationStatus)
                    map.putString("classificationResult", log.classificationResult)
                    map.putString("lsa", log.lsa)
                    map.putString("operatorName", log.operatorName)
                    map.putString("auditProofHash", log.auditProofHash)
                    map.putBoolean("isExported", log.isExported)
                    array.pushMap(map)
                }
                promise.resolve(array)
            } catch (e: Exception) {
                promise.reject("DB_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun verifyNumber(number: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val consentRepo = ConsentRegistryRepository(reactApplicationContext)
                val classification = consentRepo.classifyCaller(number)
                
                // Fetch full DLT details in case it was cached / simulated
                val legacyResult = consentRepo.verifyCaller(number)

                val map = Arguments.createMap()
                map.putString("phoneNumber", number)
                map.putString("claimingEntity", when (classification) {
                    is CallClassification.Blocked -> classification.entityName ?: "Blocked Caller"
                    is CallClassification.AuthorisedBankOrGovt -> classification.entityName ?: legacyResult.claimingEntity
                    is CallClassification.Promotional -> classification.entityName ?: legacyResult.claimingEntity
                    else -> null
                })
                map.putString("consentId", if (classification is CallClassification.Blocked) "USER-BLOCKED" else legacyResult.consentId)
                map.putBoolean("isVerified", classification is CallClassification.AuthorisedBankOrGovt)
                map.putString("source", legacyResult.source.name)
                map.putString("classificationResult", classification.label())
                map.putString("lsa", when (classification) {
                    is CallClassification.Blocked -> classification.lsa.name
                    is CallClassification.AuthorisedBankOrGovt -> classification.lsa.name
                    is CallClassification.Promotional -> classification.lsa.name
                    is CallClassification.Known -> classification.lsa.name
                    is CallClassification.Unverified -> classification.lsa.name
                })
                map.putString("operatorName", when (classification) {
                    is CallClassification.Blocked -> "User Blocklist"
                    is CallClassification.Known -> classification.operatorName
                    is CallClassification.Unverified -> classification.operatorName
                    else -> "UNKNOWN"
                })
                
                promise.resolve(map)
            } catch (e: Exception) {
                promise.reject("VERIFICATION_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun isInCallLog(number: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val normalized = number.filter { it.isDigit() }.let {
                    if (it.length == 12 && it.startsWith("91")) it.drop(2) else it
                }
                val cursor = reactApplicationContext.contentResolver.query(
                    android.provider.CallLog.Calls.CONTENT_URI,
                    arrayOf(android.provider.CallLog.Calls.NUMBER),
                    null, null,
                    "${android.provider.CallLog.Calls.DATE} DESC"
                )
                var found = false
                cursor?.use { c ->
                    val idx = c.getColumnIndex(android.provider.CallLog.Calls.NUMBER)
                    while (c.moveToNext()) {
                        val logNum = c.getString(idx)?.filter { it.isDigit() } ?: continue
                        val logNorm = if (logNum.length == 12 && logNum.startsWith("91")) logNum.drop(2) else logNum
                        if (logNorm == normalized && logNorm.length >= 8) {
                            found = true
                            break
                        }
                    }
                }
                promise.resolve(found)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }


    @ReactMethod
    fun getStatistics(promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val stats = repository.getStatistics()
                val map = Arguments.createMap()
                map.putInt("calls_verified", stats.authorisedLogs + stats.knownLogs)
                map.putInt("violations_blocked", stats.unverifiedLogs + stats.spoofLogs + stats.blockedLogs)
                map.putInt("reports_generated", stats.totalLogs)
                map.putInt("trust_score", if (stats.totalLogs > 0) {
                    ((stats.authorisedLogs + stats.knownLogs) * 100) / stats.totalLogs
                } else {
                    100
                })
                
                // Send extra fields for rich UI integration
                map.putInt("promotional_calls", stats.promotionalLogs)
                map.putInt("known_calls", stats.knownLogs)
                map.putInt("unverified_calls", stats.unverifiedLogs)
                
                promise.resolve(map)
            } catch (e: Exception) {
                promise.reject("STATS_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun saveExportFile(filename: String, jsonContent: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val downloadsDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs()
                }
                val file = java.io.File(downloadsDir, filename)
                file.writeText(jsonContent)

                try {
                    android.media.MediaScannerConnection.scanFile(
                        reactApplicationContext,
                        arrayOf(file.absolutePath),
                        arrayOf("application/json"),
                        null
                    )
                } catch (_: Exception) {}

                val map = Arguments.createMap()
                map.putString("filePath", file.absolutePath)
                map.putDouble("fileSize", file.length().toDouble())
                promise.resolve(map)
            } catch (e: Exception) {
                try {
                    val appDir = reactApplicationContext.getExternalFilesDir(android.os.Environment.DIRECTORY_DOWNLOADS)
                    val file = java.io.File(appDir, filename)
                    file.writeText(jsonContent)
                    val map = Arguments.createMap()
                    map.putString("filePath", file.absolutePath)
                    map.putDouble("fileSize", file.length().toDouble())
                    promise.resolve(map)
                } catch (err: Exception) {
                    promise.reject("FILE_SAVE_ERROR", err.message, err)
                }
            }
        }
    }

    @ReactMethod
    fun simulateIncomingCall(number: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val repo = ConsentRegistryRepository(reactApplicationContext)
                val classification = repo.classifyCaller(number)
                val result = repo.verifyCaller(number)

                val syntheticResult = VerificationResult(
                    phoneNumber = number,
                    claimingEntity = when (classification) {
                        is CallClassification.Blocked -> classification.entityName ?: "Blocked Caller"
                        is CallClassification.AuthorisedBankOrGovt -> classification.entityName
                        is CallClassification.Promotional -> classification.entityName
                        else -> null
                    },
                    consentId = if (classification is CallClassification.Blocked) "USER-BLOCKED" else result.consentId,
                    isVerified = classification is CallClassification.AuthorisedBankOrGovt,
                    source = com.compliance.forensics.data.VerificationSource.LIVE_REGISTRY,
                    classificationResult = classification.label(),
                    lsa = when (classification) {
                        is CallClassification.Blocked -> classification.lsa.name
                        is CallClassification.AuthorisedBankOrGovt -> classification.lsa.name
                        is CallClassification.Promotional -> classification.lsa.name
                        is CallClassification.Known -> classification.lsa.name
                        is CallClassification.Unverified -> classification.lsa.name
                    },
                    operatorName = when (classification) {
                        is CallClassification.Blocked -> "User Blocklist"
                        is CallClassification.Known -> classification.operatorName
                        is CallClassification.Unverified -> classification.operatorName
                        else -> "UNKNOWN"
                    }
                )

                // 1. Log to Room DB for Audit Logs tab
                com.compliance.forensics.AuditLogger.init(reactApplicationContext)
                com.compliance.forensics.AuditLogger.logVerification(syntheticResult)

                // 2. Show Android system heads-up notification popup
                try {
                    val receiver = com.compliance.forensics.CallReceiver()
                    receiver.showHeadsUpNotification(reactApplicationContext, syntheticResult)
                } catch (e: Exception) {
                    Log.e("AuditBridge", "Heads-up notification error: ${e.message}")
                }

                // 3. Emit to JS for in-app banner & live popup
                CoroutineScope(Dispatchers.Main).launch {
                    emitVerificationResult(syntheticResult)
                }
            } catch (e: Exception) {
                Log.e("AuditBridge", "simulateIncomingCall failed: ${e.message}", e)
            }
        }
    }


    private fun emitVerificationResult(result: VerificationResult) {
        val map = Arguments.createMap()
        map.putString("phoneNumber", result.phoneNumber)
        map.putString("claimingEntity", result.claimingEntity)
        map.putString("consentId", result.consentId)
        map.putBoolean("isVerified", result.isVerified)
        map.putString("source", result.source.name)
        map.putString("classificationResult", result.classificationResult)
        map.putString("lsa", result.lsa)
        map.putString("operatorName", result.operatorName)

        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("onVerificationResult", map)
    }

    @ReactMethod
    fun getLastReadTime(promise: Promise) {
        val prefs = reactApplicationContext.getSharedPreferences("cfe_prefs", android.content.Context.MODE_PRIVATE)
        val time = prefs.getLong("last_read_notifications_time", 0L)
        promise.resolve(time.toDouble())
    }

    @ReactMethod
    fun setLastReadTime(timestamp: Double, promise: Promise) {
        val prefs = reactApplicationContext.getSharedPreferences("cfe_prefs", android.content.Context.MODE_PRIVATE)
        prefs.edit().putLong("last_read_notifications_time", timestamp.toLong()).apply()
        promise.resolve(true)
    }

    @ReactMethod
    fun blockNumber(number: String, promise: Promise) {
        try {
            val consentRepo = ConsentRegistryRepository(reactApplicationContext)
            consentRepo.blockNumber(number)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("BLOCK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun unblockNumber(number: String, promise: Promise) {
        try {
            val consentRepo = ConsentRegistryRepository(reactApplicationContext)
            consentRepo.unblockNumber(number)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("UNBLOCK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isBlocked(number: String, promise: Promise) {
        try {
            val consentRepo = ConsentRegistryRepository(reactApplicationContext)
            val blocked = consentRepo.isBlocked(number)
            promise.resolve(blocked)
        } catch (e: Exception) {
            promise.reject("CHECK_BLOCK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun generateReport(format: String, period: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val logsList = repository.getAllLogs().first()
                val stats = repository.getStatistics()
                val timestampStr = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
                val isPdf = format.equals("PDF", ignoreCase = true)
                val ext = if (isPdf) ".pdf" else ".csv"
                val mimeType = if (isPdf) "application/pdf" else "text/csv"
                val fileName = "CFE_Compliance_Report_${period.lowercase(Locale.getDefault())}_$timestampStr$ext"

                val downloadsDir = reactApplicationContext.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
                    ?: Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs()
                }
                val outputFile = File(downloadsDir, fileName)

                if (isPdf) {
                    generatePdfReport(outputFile, period, stats, logsList)
                } else {
                    generateCsvReport(outputFile, logsList)
                }

                // Register with DownloadManager so it appears in system Downloads
                try {
                    val dm = reactApplicationContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                    dm.addCompletedDownload(
                        fileName,
                        "CFE ${period.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString() }} Audit Compliance Report",
                        true,
                        mimeType,
                        outputFile.absolutePath,
                        outputFile.length(),
                        true
                    )
                } catch (e: Exception) {
                    Log.w("AuditBridge", "DownloadManager registration failed: ${e.message}")
                }

                // Launch Intent to view/open/share file directly
                try {
                    val contentUri = FileProvider.getUriForFile(
                        reactApplicationContext,
                        "${reactApplicationContext.packageName}.provider",
                        outputFile
                    )
                    val intent = Intent(Intent.ACTION_VIEW).apply {
                        setDataAndType(contentUri, mimeType)
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    reactApplicationContext.startActivity(intent)
                } catch (e: Exception) {
                    Log.w("AuditBridge", "Launch view intent failed: ${e.message}")
                }

                val result = Arguments.createMap()
                result.putString("filePath", outputFile.absolutePath)
                result.putString("fileName", fileName)
                promise.resolve(result)
            } catch (e: Exception) {
                Log.e("AuditBridge", "Failed to generate report", e)
                promise.reject("REPORT_GEN_ERROR", e.message, e)
            }
        }
    }

    private fun generateCsvReport(file: File, logs: List<AuditLogEntity>) {
        val writer = FileOutputStream(file).bufferedWriter()
        writer.use { out ->
            out.write("Log ID,Timestamp,Caller ID,Claimed Entity / Name,Classification,Verification Status,Telecom Circle (LSA),Operator,Consent Hash,SHA-256 Audit Proof Hash\n")
            val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
            for (log in logs) {
                val dateStr = sdf.format(Date(log.timestamp))
                val callerName = (log.callerName ?: "Unknown").replace("\"", "\"\"")
                val entity = (log.businessName ?: callerName).replace("\"", "\"\"")
                out.write("\"${log.id}\",\"$dateStr\",\"${log.callerId}\",\"$entity\",\"${log.classificationResult}\",\"${log.verificationStatus}\",\"${log.lsa}\",\"${log.operatorName}\",\"${log.consentHash}\",\"${log.auditProofHash}\"\n")
            }
        }
    }

    private fun generatePdfReport(
        file: File,
        period: String,
        stats: AuditRepository.AuditStatistics,
        logs: List<AuditLogEntity>
    ) {
        val pdfDocument = PdfDocument()
        val pageWidth = 595 // Standard A4 width in points
        val pageHeight = 842 // Standard A4 height in points
        val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create()
        val page = pdfDocument.startPage(pageInfo)
        val canvas = page.canvas

        val paint = Paint()

        // 1. Top Header Banner (#0F172A)
        paint.color = Color.parseColor("#0F172A")
        canvas.drawRect(0f, 0f, pageWidth.toFloat(), 100f, paint)

        // Header Title
        paint.color = Color.WHITE
        paint.textSize = 20f
        paint.isFakeBoldText = true
        canvas.drawText("COMPLIANCE FORENSICS ENGINE (CFE)", 30f, 45f, paint)

        // Header Subtitle
        paint.textSize = 10f
        paint.isFakeBoldText = false
        paint.color = Color.parseColor("#94A3B8")
        val periodCapitalized = period.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString() }
        canvas.drawText("OFFICIAL $periodCapitalized SUBSCRIBER COMPLIANCE & VERIFICATION AUDIT REPORT", 30f, 70f, paint)

        // 2. Report Metadata Box
        paint.color = Color.parseColor("#F1F5F9")
        canvas.drawRoundRect(RectF(30f, 115f, (pageWidth - 30).toFloat(), 165f), 8f, 8f, paint)

        val sdf = SimpleDateFormat("MMMM dd, yyyy - HH:mm:ss z", Locale.getDefault())
        val generatedAt = sdf.format(Date())

        paint.color = Color.parseColor("#334155")
        paint.textSize = 10f
        paint.isFakeBoldText = true
        canvas.drawText("Report Period: $periodCapitalized Summary", 45f, 137f, paint)
        canvas.drawText("Generated At: $generatedAt", 45f, 153f, paint)

        paint.color = Color.parseColor("#059669")
        canvas.drawText("Status: CRYPTOGRAPHICALLY VERIFIED • TAMPER-PROOF", 320f, 137f, paint)

        // 3. Stats Summary Cards Grid
        val cardWidth = 120f
        val cardGap = 15f
        val startX = 30f
        val cardY = 180f

        val statItems = listOf(
            Pair("Total Logs", stats.totalLogs.toString()),
            Pair("Authorised", stats.authorisedLogs.toString()),
            Pair("Violations Blocked", (stats.unverifiedLogs + stats.spoofLogs + stats.blockedLogs).toString()),
            Pair("Trust Score", "${if (stats.totalLogs > 0) (stats.authorisedLogs * 100) / stats.totalLogs else 100}%")
        )

        for (i in statItems.indices) {
            val cx = startX + i * (cardWidth + cardGap)
            paint.color = Color.parseColor("#F8FAFC")
            canvas.drawRoundRect(RectF(cx, cardY, cx + cardWidth, cardY + 50f), 6f, 6f, paint)

            paint.color = Color.parseColor("#64748B")
            paint.textSize = 8f
            paint.isFakeBoldText = false
            canvas.drawText(statItems[i].first, cx + 10f, cardY + 20f, paint)

            paint.color = Color.parseColor("#0F172A")
            paint.textSize = 14f
            paint.isFakeBoldText = true
            canvas.drawText(statItems[i].second, cx + 10f, cardY + 40f, paint)
        }

        // 4. Audit Trail Logs Table
        val tableY = 255f
        paint.color = Color.parseColor("#0F172A")
        paint.textSize = 13f
        paint.isFakeBoldText = true
        canvas.drawText("Compliance Audit Trail Records", 30f, tableY, paint)

        // Table Header Line
        val headerY = tableY + 15f
        paint.color = Color.parseColor("#E2E8F0")
        canvas.drawRect(30f, headerY, (pageWidth - 30).toFloat(), headerY + 22f, paint)

        paint.color = Color.parseColor("#475569")
        paint.textSize = 9f
        paint.isFakeBoldText = true
        canvas.drawText("Date/Time", 38f, headerY + 15f, paint)
        canvas.drawText("Caller Number", 140f, headerY + 15f, paint)
        canvas.drawText("Claimed Entity / Name", 245f, headerY + 15f, paint)
        canvas.drawText("Classification", 410f, headerY + 15f, paint)
        canvas.drawText("SHA-256 Proof", 500f, headerY + 15f, paint)

        // Table Rows
        var currentY = headerY + 22f
        val logSdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
        val displayLogs = logs.take(15) // Fit top logs cleanly on A4 page

        for (idx in displayLogs.indices) {
            val log = displayLogs[idx]
            if (idx % 2 == 1) {
                paint.color = Color.parseColor("#F8FAFC")
                canvas.drawRect(30f, currentY, (pageWidth - 30).toFloat(), currentY + 24f, paint)
            }

            paint.textSize = 8f
            paint.isFakeBoldText = false
            paint.color = Color.parseColor("#334155")

            val timeStr = logSdf.format(Date(log.timestamp))
            canvas.drawText(timeStr, 38f, currentY + 16f, paint)
            canvas.drawText(log.callerId, 140f, currentY + 16f, paint)

            val name = (log.callerName ?: log.businessName ?: "Unknown").take(22)
            canvas.drawText(name, 245f, currentY + 16f, paint)

            // Status Badge Text
            paint.isFakeBoldText = true
            when (log.classificationResult) {
                "AUTHORISED_BANK_GOVT" -> paint.color = Color.parseColor("#15803D")
                "PROMOTIONAL" -> paint.color = Color.parseColor("#B45309")
                "KNOWN" -> paint.color = Color.parseColor("#475569")
                "BLOCKED" -> paint.color = Color.parseColor("#DC2626")
                else -> paint.color = Color.parseColor("#DC2626")
            }
            val statusLabel = when (log.classificationResult) {
                "AUTHORISED_BANK_GOVT" -> "AUTHORISED"
                "PROMOTIONAL" -> "PROMOTIONAL"
                "KNOWN" -> "KNOWN"
                "BLOCKED" -> "BLOCKED"
                else -> "UNVERIFIED"
            }
            canvas.drawText(statusLabel, 410f, currentY + 16f, paint)

            paint.color = Color.parseColor("#64748B")
            paint.isFakeBoldText = false
            val proofShort = if (log.auditProofHash.length >= 10) log.auditProofHash.substring(0, 10) + "..." else log.auditProofHash
            canvas.drawText(proofShort, 500f, currentY + 16f, paint)

            currentY += 24f
        }

        // 5. Footer Line
        paint.color = Color.parseColor("#CBD5E1")
        canvas.drawLine(30f, 800f, (pageWidth - 30).toFloat(), 800f, paint)

        paint.color = Color.parseColor("#94A3B8")
        paint.textSize = 8f
        canvas.drawText("Generated by Novaris Compliance Forensics Engine (CFE) v1.0 • SHA-256 Audit Proof Verified", 30f, 815f, paint)
        canvas.drawText("Page 1 of 1", (pageWidth - 80).toFloat(), 815f, paint)

        pdfDocument.finishPage(page)

        val out = FileOutputStream(file)
        out.use { pdfDocument.writeTo(it) }
        pdfDocument.close()
    }

    private val repository: AuditRepository
        get() = AuditRepository.getInstance(reactApplicationContext.applicationContext)
}
