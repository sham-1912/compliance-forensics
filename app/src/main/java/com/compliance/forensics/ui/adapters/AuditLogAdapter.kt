package com.compliance.forensics.ui.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.compliance.forensics.R
import com.compliance.forensics.data.database.AuditLogEntity
import com.compliance.forensics.utils.HashUtils

class AuditLogAdapter(
    private val onItemClick: (AuditLogEntity) -> Unit,
    private val onExportClick: (AuditLogEntity) -> Unit
) : RecyclerView.Adapter<AuditLogAdapter.ViewHolder>() {

    private var logs: List<AuditLogEntity> = emptyList()

    fun submitList(newLogs: List<AuditLogEntity>) {
        logs = newLogs
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_audit_log, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val log = logs[position]
        holder.bind(log)

        holder.itemView.setOnClickListener { onItemClick(log) }
        holder.btnExport.setOnClickListener { onExportClick(log) }
    }

    override fun getItemCount(): Int = logs.size

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvCallerId: TextView = itemView.findViewById(R.id.tvCallerId)
        private val tvCallerName: TextView = itemView.findViewById(R.id.tvCallerName)
        private val tvStatus: TextView = itemView.findViewById(R.id.tvStatus)
        private val tvTimestamp: TextView = itemView.findViewById(R.id.tvTimestamp)
        private val tvProofHash: TextView = itemView.findViewById(R.id.tvProofHash)
        val btnExport: TextView = itemView.findViewById(R.id.btnExport)

        fun bind(log: AuditLogEntity) {
            tvCallerId.text = log.callerId
            tvCallerName.text = log.callerName
            tvStatus.text = log.verificationStatus
            tvStatus.setTextColor(log.getStatusColor())
            tvTimestamp.text = log.getFormattedTimestamp()
            tvProofHash.text = "Proof: ${HashUtils.getShortHash(log.auditProofHash)}"
            btnExport.text = if (log.isExported) "✅ Exported" else "📤 Export"
        }
    }
}