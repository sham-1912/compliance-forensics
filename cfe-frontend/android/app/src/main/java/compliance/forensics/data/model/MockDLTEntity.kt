package com.compliance.forensics.data.model

data class MockDLTEntity(
    val callerId: String,
    val entityName: String,
    val consentHash: String,
    val consentDate: String,
    val isActive: Boolean = true
) {
    companion object {
        fun getMockDatabase(): List<MockDLTEntity> {
            return listOf(
                MockDLTEntity("9876543210", "HDFC Bank", "HDFC-ACC-12345-2024", "2024-01-15"),
                MockDLTEntity("9876543211", "HDFC Bank", "HDFC-LOAN-67890-2024", "2024-02-20"),
                MockDLTEntity("5551234567", "SBI Bank", "SBI-ACC-54321-2024", "2024-03-01"),
                MockDLTEntity("8888888888", "ICICI Bank", "ICICI-CC-98765-2024", "2024-01-10"),
                MockDLTEntity("9999999999", "Axis Bank", "AXIS-SAV-11111-2024", "2024-02-28")
            )
        }
    }
}