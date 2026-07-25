package com.cfe.app

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.novaris.complianceforensics.AuditLogger
import com.novaris.complianceforensics.VerificationResultBus
import com.novaris.complianceforensics.data.ConsentRepository
import com.novaris.complianceforensics.data.VerificationResult
import com.novaris.complianceforensics.data.VerificationSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Drives the manual "Quick Verify" flow and demo simulation from
 * HomeFragment, and holds the protection-toggle backing state.
 *
 * Uses the same [ConsentRepository] + [AuditLogger] pipeline that
 * [com.novaris.complianceforensics.CallReceiver] uses for automatic
 * incoming-call verification, but triggered on-demand by the user.
 */
class CallVerificationViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = ConsentRepository(application)

    private val _verificationState = MutableLiveData<VerificationUiModel>()
    val verificationState: LiveData<VerificationUiModel> = _verificationState

    private val _isProtectionActive = MutableStateFlow(true)
    val isProtectionActive: StateFlow<Boolean> = _isProtectionActive.asStateFlow()

    fun setProtectionActive(active: Boolean) {
        _isProtectionActive.value = active
    }

    fun verify(phoneNumber: String) {
        _verificationState.value = VerificationUiModel.Checking(phoneNumber)

        // Also update the shared bus so MainActivity's card stays in sync
        VerificationResultBus.postResult(
            VerificationResult(
                phoneNumber = phoneNumber,
                claimingEntity = null,
                consentId = null,
                isVerified = false,
                source = VerificationSource.CHECKING
            )
        )

        viewModelScope.launch(Dispatchers.IO) {
            try {
                val result = repository.verifyCaller(phoneNumber)

                AuditLogger.init(getApplication())
                AuditLogger.logVerification(result, triggerSource = "MANUAL")

                VerificationResultBus.postResult(result)
                _verificationState.postValue(VerificationUiModel.Done(result))
            } catch (e: Exception) {
                _verificationState.postValue(
                    VerificationUiModel.Error(phoneNumber, e.message ?: "Verification failed")
                )
            }
        }
    }

    fun simulateCall() {
        val phoneNumber = DEMO_NUMBER
        _verificationState.value = VerificationUiModel.Checking(phoneNumber)

        VerificationResultBus.postResult(
            VerificationResult(
                phoneNumber = phoneNumber,
                claimingEntity = null,
                consentId = null,
                isVerified = false,
                source = VerificationSource.CHECKING
            )
        )

        viewModelScope.launch(Dispatchers.IO) {
            try {
                val result = repository.verifyCaller(phoneNumber)

                AuditLogger.init(getApplication())
                AuditLogger.logVerification(result, triggerSource = "DEMO")

                VerificationResultBus.postResult(result)
                _verificationState.postValue(VerificationUiModel.Done(result))
            } catch (e: Exception) {
                _verificationState.postValue(
                    VerificationUiModel.Error(phoneNumber, e.message ?: "Simulated call failed")
                )
            }
        }
    }

    sealed class VerificationUiModel {
        data class Checking(val phoneNumber: String) : VerificationUiModel()
        data class Done(val result: VerificationResult) : VerificationUiModel()
        data class Error(val phoneNumber: String, val message: String) : VerificationUiModel()
    }

    companion object {
        const val DEMO_NUMBER = "1600112233"
    }
}
