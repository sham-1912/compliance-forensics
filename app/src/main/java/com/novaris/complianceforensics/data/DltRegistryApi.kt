package com.novaris.complianceforensics.data

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Query

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

    companion object {
        private const val BASE_URL = "https://mock-dlt-registry.novaris.example/"

        fun create(): DltRegistryApi {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }
            val client = OkHttpClient.Builder()
                .addInterceptor(logging)
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
