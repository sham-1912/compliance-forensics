package com.compliance.forensics.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.compliance.forensics.data.database.AuditLogEntity
import com.compliance.forensics.data.repository.AuditRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale

class AuditViewModel(
    private val repository: AuditRepository
) : ViewModel() {

    val allLogs: Flow<List<AuditLogEntity>> = repository.getAllLogs()

    private val _statistics = MutableStateFlow<AuditRepository.AuditStatistics?>(null)
    val statistics: StateFlow<AuditRepository.AuditStatistics?> = _statistics.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _exportResult = MutableStateFlow<String?>(null)
    val exportResult: StateFlow<String?> = _exportResult.asStateFlow()

    // TEAMMATE (Person 1 — UI): collectAsState() on statistics to populate
    // the four dashboard stat cards: Authorised / Promotional / Known / Unverified.

    init {
        loadStatistics()
    }

    fun loadStatistics() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                _statistics.value = repository.getStatistics()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun refreshStatistics() {
        loadStatistics()
    }

    // --- Status / classification / LSA filters ---

    fun getLogsByStatus(status: String): Flow<List<AuditLogEntity>> {
        return repository.getLogsByStatus(status)
    }

    /**
     * Filter logs by TRAI classification result.
     * @param result one of: AUTHORISED_BANK_GOVT | PROMOTIONAL | KNOWN | UNVERIFIED
     *
     * TEAMMATE (Person 1): use this to implement the filter chips in the Reports tab.
     */
    fun getLogsByClassification(result: String): Flow<List<AuditLogEntity>> {
        return repository.getLogsByClassification(result)
    }

    /**
     * Filter logs by TRAI LSA (telecom circle).
     * @param lsa One of the 22 LSA display names, e.g. "Karnataka", "Delhi".
     *
     * TEAMMATE (Person 1): use this for the "By Circle" filter dropdown in Reports.
     */
    fun getLogsForLsa(lsa: String): Flow<List<AuditLogEntity>> {
        return repository.getLogsForLsa(lsa)
    }

    /**
     * Filter logs by operator name: Jio | Airtel | Vi | BSNL | UNKNOWN.
     *
     * TEAMMATE (Person 1): use this for the "By Operator" filter dropdown in Reports.
     */
    fun getLogsForOperator(operator: String): Flow<List<AuditLogEntity>> {
        return repository.getLogsForOperator(operator)
    }

    // --- Export ---

    fun exportLogAsProof(logId: Long) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val log = repository.getLogById(logId)
                if (log != null) {
                    val proof = generateExportProof(log)
                    repository.markAsExported(logId)
                    _exportResult.value = proof
                } else {
                    _exportResult.value = "Error: Log not found"
                }
            } catch (e: Exception) {
                _exportResult.value = "Error: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    private fun generateExportProof(log: AuditLogEntity): String {
        return """
            ===========================================
            COMPLIANCE FORENSICS ENGINE - AUDIT PROOF
            ===========================================
            
            Caller ID:             ${log.callerId}
            Caller Name:           ${log.callerName}
            Classification:        ${log.classificationResult}
            LSA (Telecom Circle):  ${log.lsa}
            Operator:              ${log.operatorName}
            Verification Status:   ${log.verificationStatus}
            Timestamp:             ${log.getFormattedTimestamp()}
            
            Consent Hash:          ${log.consentHash}
            Audit Proof Hash:      ${log.auditProofHash}
            
            --------------------------------------------------
            VERIFICATION DETAILS
            --------------------------------------------------
            This proof was generated on-device using SHA-256
            cryptographic hashing. The hash covers:
            
            Paudt = SHA-256(IDcaller || classificationResult || t)
            
            Where:
            - IDcaller:             ${log.callerId}
            - classificationResult: ${log.classificationResult}
            - t:                    ${log.timestamp}
            
            --------------------------------------------------
            TRAI COMPLIANCE NOTE
            --------------------------------------------------
            ${traiComplianceNote(log.classificationResult)}
            
            --------------------------------------------------
            LEGAL VALIDITY
            --------------------------------------------------
            This record complies with:
            - TRAI TCCCPR 2018 Guidelines
            - TRAI DLT Regulations
            - RBI DCA Pilot Requirements
            - IT SPDI Rules (Privacy Compliant)
            
            Generated by: Compliance Forensics Engine v2.0
            Export Time: ${SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale.getDefault()).format(System.currentTimeMillis())}
            ===========================================
        """.trimIndent()
    }

    private fun traiComplianceNote(classification: String): String = when (classification) {
        "AUTHORISED_BANK_GOVT" ->
            "This caller is registered under TRAI's 1600-series (Authorised Bank/Govt).\n" +
            "Per TCCCPR §6, this number must NOT be labelled spam by third-party apps."
        "PROMOTIONAL" ->
            "This caller is a TRAI-registered telemarketer (140-series).\n" +
            "Per TCCCPR §6, this number must NOT be labelled spam by third-party apps."
        "KNOWN" ->
            "This number appeared in the device's call history.\n" +
            "Classification is based on prior interaction, not TRAI registry data."
        else ->
            "This number is not registered in any TRAI-controlled series and\n" +
            "has no prior call history. 'Unverified' does not imply spam.\n" +
            "A first-time legitimate caller receives this label too."
    }

    fun clearExportResult() {
        _exportResult.value = null
    }
}