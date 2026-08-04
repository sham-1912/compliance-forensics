package com.compliance.forensics.data

import android.content.Context
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.doThrow
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class ConsentRepositoryTest {

    private lateinit var mockContext: Context
    private lateinit var mockApi: DltRegistryApi
    private lateinit var mockDatabaseHelper: DatabaseHelper
    private lateinit var repository: ConsentRepository

    @Before
    fun setUp() {
        mockContext = mock()
        mockApi = mock()
        mockDatabaseHelper = mock()

        whenever(mockContext.applicationContext).thenReturn(mockContext)

        repository = ConsentRepository(
            context = mockContext,
            api = mockApi,
            databaseHelper = mockDatabaseHelper
        )
    }

    @Test
    fun testVerifyCaller_cacheHit_returnsLocalCache() = runTest {
        val phoneNumber = "+919876543210"
        val cachedResponse = ConsentResponse(
            phoneNumber = phoneNumber,
            principalEntityName = "HDFC BANK LTD",
            consentId = "HDFC-8932",
            consentValid = true,
            registeredWithDlt = true
        )

        whenever(mockDatabaseHelper.getCachedConsent(phoneNumber)).thenReturn(cachedResponse)

        val result = repository.verifyCaller(phoneNumber)

        assertEquals(phoneNumber, result.phoneNumber)
        assertEquals("HDFC BANK LTD", result.claimingEntity)
        assertEquals("HDFC-8932", result.consentId)
        assertTrue(result.isVerified)
        assertEquals(VerificationSource.LOCAL_CACHE, result.source)

        verify(mockApi, never()).lookupConsent(any())
    }

    @Test
    fun testVerifyCaller_cacheMiss_apiSuccess_cachesAndReturnsLiveRegistry() = runTest {
        val phoneNumber = "+919999988888"
        val apiResponse = ConsentResponse(
            phoneNumber = phoneNumber,
            principalEntityName = "ICICI BANK",
            consentId = "ICICI-1102",
            consentValid = true,
            registeredWithDlt = true
        )

        whenever(mockDatabaseHelper.getCachedConsent(phoneNumber)).thenReturn(null)
        whenever(mockApi.lookupConsent(phoneNumber)).thenReturn(apiResponse)

        val result = repository.verifyCaller(phoneNumber)

        assertEquals(phoneNumber, result.phoneNumber)
        assertEquals("ICICI BANK", result.claimingEntity)
        assertEquals("ICICI-1102", result.consentId)
        assertTrue(result.isVerified)
        assertEquals(VerificationSource.LIVE_REGISTRY, result.source)

        verify(mockDatabaseHelper, times(1)).cacheConsent(apiResponse)
    }

    @Test
    fun testVerifyCaller_apiFailure_returnsUnknownFailClosed() = runTest {
        val phoneNumber = "+918888888888"

        whenever(mockDatabaseHelper.getCachedConsent(phoneNumber)).thenReturn(null)
        whenever(mockApi.lookupConsent(phoneNumber)).doThrow(RuntimeException("Simulated API failure"))

        val result = repository.verifyCaller(phoneNumber)

        assertEquals(phoneNumber, result.phoneNumber)
        assertNull(result.claimingEntity)
        assertNull(result.consentId)
        assertFalse(result.isVerified)
        assertEquals(VerificationSource.UNKNOWN, result.source)

        verify(mockDatabaseHelper, never()).cacheConsent(any())
    }
}
