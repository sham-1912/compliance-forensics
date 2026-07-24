package com.novaris.complianceforensics

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.novaris.complianceforensics.databinding.ActivityMainBinding

/**
 * Owner: Person 1 (Team Lead / UI Developer)
 *
 * Renders the incoming-call verification card. Observes verification
 * results produced by [DatabaseHelper] and displays them via [binding].
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // TODO(Person 1): observe verification LiveData from DatabaseHelper/ViewModel
        // and update binding.callerNumberText / claimingEntityText / verificationStatusText
    }
}
