/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

package xyz.kyngs.librelogin.common.util;

import org.junit.jupiter.api.Test;
import xyz.kyngs.librelogin.api.crypto.HashedPassword;

import static org.junit.jupiter.api.Assertions.*;

class CryptoUtilTest {

  @Test
  void testConvertHashWithValidFormat() {
    String validHash = "algo$cost$salt$hash";
    var result = CryptoUtil.convertHash(validHash);
    assertEquals("algo", result.key());
    assertEquals("cost", result.value());
  }

  @Test
  void testConvertHashWithInvalidFormat() {
    // This simulates the SHA-256 hash that caused the crash
    // SHA-256 hashes in this system don't follow the $ separator format expected by
    // BCrypt
    String invalidHash = "b5e...sha256hash";

    assertThrows(IllegalArgumentException.class, () -> {
      CryptoUtil.convertHash(invalidHash);
    }, "Should throw IllegalArgumentException for hash without separators");
  }
}
