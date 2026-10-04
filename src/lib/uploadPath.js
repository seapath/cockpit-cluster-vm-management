/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Plugin-owned directory for uploaded VM images and XML. It is kept out of the
// shared /tmp so that a crafted file name cannot be used to overwrite an
// arbitrary root-writable path.
export const UPLOAD_DIR = '/var/lib/cockpit-cluster-vm-management/uploads';

// Turn an untrusted file name into a safe basename, or return null when nothing
// safe remains. Directory components are stripped, characters outside the
// allow-list are replaced, and leading dots are dropped.
export function safeUploadPath(fileName) {
    const basename = String(fileName || '').split(/[\\/]/).pop();
    const sanitized = basename.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '');
    if (!sanitized) {
        return null;
    }
    return `${UPLOAD_DIR}/${sanitized}`;
}
