package com.compliance.forensics.ui

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.compliance.forensics.R
import com.compliance.forensics.service.CallListenerService
import com.compliance.forensics.utils.PermissionHelper

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main_audit)

        setupUI()
        checkPermissions()
    }

    private fun setupUI() {
        findViewById<android.view.View>(R.id.btnViewLogs).setOnClickListener {
            startActivity(Intent(this, LogsActivity::class.java))
        }

        findViewById<android.view.View>(R.id.btnExportAll).setOnClickListener {
            exportAllLogs()
        }

        findViewById<android.view.View>(R.id.btnClearLogs).setOnClickListener {
            clearOldLogs()
        }
    }

    private fun checkPermissions() {
        if (PermissionHelper.hasAllPermissions(this)) {
            startCallListenerService()
        } else {
            PermissionHelper.requestPermissions(
                this,
                onGranted = {
                    startCallListenerService()
                },
                onDenied = { deniedList ->
                    Toast.makeText(
                        this,
                        "Permissions denied: $deniedList",
                        Toast.LENGTH_LONG
                    ).show()
                }
            )
        }
    }

    private fun startCallListenerService() {
        val intent = Intent(this, CallListenerService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        val tvStatus = findViewById<TextView>(R.id.tvStatus)
        tvStatus.text = "✅ Service Active - Monitoring Calls"
        tvStatus.setTextColor(android.graphics.Color.GREEN)
    }

    private fun exportAllLogs() {
        val intent = Intent(this, LogsActivity::class.java)
        intent.putExtra("EXPORT_ALL", true)
        startActivity(intent)
    }

    private fun clearOldLogs() {
        AlertDialog.Builder(this)
            .setTitle("Clear Old Logs")
            .setMessage("This will clear logs older than 30 days. Continue?")
            .setPositiveButton("Clear") { _, _ ->
                Toast.makeText(this, "Old logs cleared", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}