/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.web;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Manages request rate limiting based on IP addresses using a sliding expiration cache.
 *
 * <p>This class utilizes a Caffeine cache to store and expire request counters for each unique IP.
 * It provides a basic leaky-bucket or fixed-window style filtering to prevent abuse of the API.
 */
public class RateLimitManager {

    /**
     * Cache storing the request counts per IP.
     *
     * <p>Keys are IP strings, Values are AtomicIntegers representing the request count. Entries
     * expire 1 minute after creation (fixed window).
     */
    private final Cache<String, AtomicInteger> requestCounts;

    /** Maximum allowed "cost" units per minute per IP. */
    private static final int MAX_REQUESTS_PER_MINUTE = 100;

    /** Initializes the RateLimitManager with a 1-minute window. */
    public RateLimitManager() {
        this.requestCounts = Caffeine.newBuilder().expireAfterWrite(1, TimeUnit.MINUTES).build();
    }

    /**
     * Attempts to acquire 1 unit of cost for the given IP.
     *
     * @param ip The IP address of the requester.
     * @return true if the request is allowed (within limit), false otherwise.
     */
    public boolean tryAcquire(String ip) {
        return tryAcquire(ip, 1);
    }

    /**
     * Attempts to acquire the specified cost associated with a request.
     *
     * @param ip The IP address of the requester.
     * @param cost The "weight" of the request (e.g., login attempts are more expensive).
     * @return true if the request is allowed, false if the limit is exceeded.
     */
    public boolean tryAcquire(String ip, int cost) {
        AtomicInteger counter = requestCounts.get(ip, k -> new AtomicInteger(0));
        // We use the cache object monitoring for thread safety on the specific counter
        // or just rely on AtomicInteger which is thread safe.
        // There is a race condition where two threads create the AtomicInteger, but
        // Caffeine handles the computeIfAbsent logic atomically for the key.

        int newValue = counter.addAndGet(cost);
        return newValue <= MAX_REQUESTS_PER_MINUTE;
    }

    public int getRemainingRequests(String ip) {
        AtomicInteger counter = requestCounts.getIfPresent(ip);
        if (counter == null) return MAX_REQUESTS_PER_MINUTE;
        return Math.max(0, MAX_REQUESTS_PER_MINUTE - counter.get());
    }
}
