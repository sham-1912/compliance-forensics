package com.compliance.forensics.service

import com.compliance.forensics.data.model.CallVerificationResult
import com.compliance.forensics.data.model.MockDLTEntity
import kotlinx.coroutines.delay
import kotlin.random.Random

class ConsentGateway {

    private val mockDatabase = MockDLTEntity.getMockDatabase()

    suspend fun verifyCaller(
        callerId: String,
        headerData: String = ""
    ): CallVerificationResult {
        delay(300)

        val entity = mockDatabase.find {
            it.callerId == callerId && it.isActive
        }

        return if (entity != null) {
            val isSpoof = Random.nextInt(10) == 0

            if (isSpoof) {
                CallVerificationResult(
                    callerId = callerId,
                    callerName = "SPOOF: ${entity.entityName}",
                    verificationStatus = CallVerificationResult.VerificationStatus.SPOOF,
                    consentHash = entity.consentHash,
                    rawHeaderData = headerData
                )
            } else {
                CallVerificationResult(
                    callerId = callerId,
                    callerName = entity.entityName,
                    verificationStatus = CallVerificationResult.VerificationStatus.VERIFIED,
                    consentHash = entity.consentHash,
                    rawHeaderData = headerData
                )
            }
        } else {
            CallVerificationResult(
                callerId = callerId,
                callerName = "Unknown Caller",
                verificationStatus = CallVerificationResult.VerificationStatus.UNVERIFIED,
                consentHash = "NO_CONSENT_${System.currentTimeMillis()}",
                rawHeaderData = headerData
            )
        }
    }
}