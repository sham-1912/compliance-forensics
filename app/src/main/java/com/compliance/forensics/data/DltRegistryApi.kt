package com.compliance.forensics.data

import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Query
import java.io.IOException

/**
 * Owner: Person 3 (Database Developer)
 *
 * Hackathon scope: points at a mock endpoint that mirrors the TRAI DCA
 * consent lookup contract. Roadmap item: swap BASE_URL for the real
 * TRAI DLT gateway once credentials are provisioned (see slide "Future
 * Product Roadmap").
 */
interface DltRegistryApi {

    @GET("v1/consent/lookup")
    suspend fun lookupConsent(@Query("number") phoneNumber: String): ConsentResponse

    class MockDltInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val request = chain.request()
            val url = request.url

            if (url.encodedPath == "/v1/consent/lookup" || url.encodedPath.endsWith("/v1/consent/lookup")) {
                val number = url.queryParameter("number") ?: ""

                val sanitizedNumber = number.replace(" ", "")
                if (sanitizedNumber == "+918888888888" || sanitizedNumber == "8888888888") {
                    throw IOException("Simulated network timeout for testing fallback")
                }

                val responseJson = when (sanitizedNumber) {
                    "+919876543210", "9876543210" -> """
                        {
                            "phoneNumber": "$number",
                            "principalEntityName": "HDFC BANK LTD",
                            "consentId": "HDFC-8932",
                            "consentValid": true,
                            "registeredWithDlt": true
                        }
                    """.trimIndent()
                    "+919999988888", "9999988888" -> """
                        {
                            "phoneNumber": "$number",
                            "principalEntityName": "ICICI BANK",
                            "consentId": "ICICI-1102",
                            "consentValid": true,
                            "registeredWithDlt": true
                        }
                    """.trimIndent()
                    "+919111122222", "9111122222" -> """
                        {
                            "phoneNumber": "$number",
                            "principalEntityName": "SBI BANK",
                            "consentId": "SBI-5544",
                            "consentValid": false,
                            "registeredWithDlt": true
                        }
                    """.trimIndent()
                    else -> """
                        {
                            "phoneNumber": "$number",
                            "principalEntityName": null,
                            "consentId": null,
                            "consentValid": false,
                            "registeredWithDlt": false
                        }
                    """.trimIndent()
                }

                val mediaType = "application/json".toMediaTypeOrNull()
                val responseBody = responseJson.toResponseBody(mediaType)

                return Response.Builder()
                    .request(request)
                    .protocol(Protocol.HTTP_1_1)
                    .code(200)
                    .message("OK")
                    .body(responseBody)
                    .build()
            }

            return chain.proceed(request)
        }
    }

    companion object {
        private const val BASE_URL = "https://mock-dlt-registry.novaris.example/"

        fun create(): DltRegistryApi {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }
            val client = OkHttpClient.Builder()
                .addInterceptor(logging)
                .addInterceptor(MockDltInterceptor())
                .build()

            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(DltRegistryApi::class.java)
        }
    }
}
