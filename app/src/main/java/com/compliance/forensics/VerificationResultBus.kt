package com.compliance.forensics

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.compliance.forensics.data.VerificationResult

/**
 * Owner: Person 2 (Call Detection Developer)
 *
 * CallReceiver has no direct reference to MainActivity (and may run
 * when the activity isn't even open), so results are posted here and
 * MainActivity observes them when it's in the foreground.
 */
object VerificationResultBus {

    private val _latestResult = MutableLiveData<VerificationResult>()
    val latestResult: LiveData<VerificationResult> = _latestResult

    fun postResult(result: VerificationResult) {
        _latestResult.postValue(result)
    }
}
