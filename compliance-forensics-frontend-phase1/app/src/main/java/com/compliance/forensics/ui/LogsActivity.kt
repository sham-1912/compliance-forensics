package com.compliance.forensics.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.compliance.forensics.R
import com.compliance.forensics.data.database.AuditLogEntity
import com.compliance.forensics.data.repository.AuditRepository
import com.compliance.forensics.ui.adapters.AuditLogAdapter
import com.compliance.forensics.viewmodel.AuditViewModel
import kotlinx.coroutines.launch

class LogsActivity : AppCompatActivity() {

    private lateinit var adapter: AuditLogAdapter
    private lateinit var viewModel: AuditViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_logs)

        val repository = AuditRepository.getInstance(applicationContext)
        viewModel = AuditViewModel(repository)

        setupRecyclerView()
        setupToolbar()
        observeData()
        loadStatistics()

        if (intent.getBooleanExtra("EXPORT_ALL", false)) {
            exportAllLogs()
        }
    }

    private fun setupRecyclerView() {
        adapter = AuditLogAdapter(
            onItemClick = { log -> showLogDetails(log) },
            onExportClick = { log -> exportSingleLog(log) }
        )

        findViewById<RecyclerView>(R.id.rvLogs).apply {
            layoutManager = LinearLayoutManager(this@LogsActivity)
            adapter = this@LogsActivity.adapter
        }
    }

    private fun setupToolbar() {
        val toolbar = findViewById<androidx.appcompat.widget.Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Audit Logs"
    }

    private fun observeData() {
        lifecycleScope.launch {
            viewModel.allLogs.collect { logs ->
                adapter.submitList(logs)
                updateEmptyState(logs.isEmpty())
            }
        }

        lifecycleScope.launch {
            viewModel.exportResult.collect { result ->
                result?.let {
                    showExportDialog(it)
                    viewModel.clearExportResult()
                }
            }
        }

        lifecycleScope.launch {
            viewModel.isLoading.collect { isLoading ->
                findViewById<View>(R.id.progressBar).visibility =
                    if (isLoading) View.VISIBLE else View.GONE
            }
        }
    }

    @Suppress("SetTextI18n")
    private fun loadStatistics() {
        viewModel.refreshStatistics()
        lifecycleScope.launch {
            viewModel.statistics.collect { stats ->
                stats?.let {
                    findViewById<TextView>(R.id.tvStats).text =
                        "Total: ${it.totalLogs} | Verified: ${it.verifiedLogs} | Spoof: ${it.spoofLogs} | Unverified: ${it.unverifiedLogs}"
                }
            }
        }
    }

    private fun updateEmptyState(isEmpty: Boolean) {
        findViewById<View>(R.id.tvEmpty).visibility = if (isEmpty) View.VISIBLE else View.GONE
        findViewById<View>(R.id.rvLogs).visibility = if (isEmpty) View.GONE else View.VISIBLE
    }

    private fun showLogDetails(log: AuditLogEntity) {
        val details = """
            📋 Audit Log Details
            ====================
            ID: ${log.id}
            Caller ID: ${log.callerId}
            Name: ${log.callerName}
            Status: ${log.verificationStatus}
            Time: ${log.getFormattedTimestamp()}

            🔐 Audit Proof Hash:
            ${log.auditProofHash}

            📝 Consent Hash:
            ${log.consentHash}

            📤 Exported: ${if (log.isExported) "Yes" else "No"}
        """.trimIndent()

        AlertDialog.Builder(this)
            .setTitle("Audit Log Details")
            .setMessage(details)
            .setPositiveButton("Close", null)
            .show()
    }

    private fun exportSingleLog(log: AuditLogEntity) {
        viewModel.exportLogAsProof(log.id)
    }

    private fun exportAllLogs() {
        Toast.makeText(this, "Exporting all logs...", Toast.LENGTH_SHORT).show()
    }

    @Suppress("SetTextI18n")
    private fun showExportDialog(proof: String) {
        AlertDialog.Builder(this)
            .setTitle("📤 Export Proof")
            .setMessage(proof)
            .setPositiveButton("Copy") { _, _ ->
                copyToClipboard(proof)
                Toast.makeText(this, "Copied to clipboard!", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Close", null)
            .show()
    }

    private fun copyToClipboard(text: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val clipboard = getSystemService(ClipboardManager::class.java)
            val clip = ClipData.newPlainText("Audit Proof", text)
            clipboard?.setPrimaryClip(clip)
        } else {
            @Suppress("DEPRECATION")
            val clipboard = getSystemService(CLIPBOARD_SERVICE) as ClipboardManager
            val clip = ClipData.newPlainText("Audit Proof", text)
            clipboard.setPrimaryClip(clip)
        }
    }
}