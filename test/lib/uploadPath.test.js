/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { UPLOAD_DIR, safeUploadPath } from '../../src/lib/uploadPath.js';

describe('safeUploadPath', () => {
    it('keeps a plain file name inside the plugin directory', () => {
        expect(safeUploadPath('debian-12.qcow2'))
            .toBe(`${UPLOAD_DIR}/debian-12.qcow2`);
    });

    it('keeps the allowed punctuation characters', () => {
        expect(safeUploadPath('VM_1.2-3.qcow2'))
            .toBe(`${UPLOAD_DIR}/VM_1.2-3.qcow2`);
    });

    it('strips unix directory components', () => {
        expect(safeUploadPath('../../etc/passwd'))
            .toBe(`${UPLOAD_DIR}/passwd`);
    });

    it('strips windows directory components', () => {
        expect(safeUploadPath('..\\..\\windows\\system32\\evil.xml'))
            .toBe(`${UPLOAD_DIR}/evil.xml`);
    });

    it('removes leading dots so dotfiles cannot be created', () => {
        expect(safeUploadPath('.hidden.qcow2'))
            .toBe(`${UPLOAD_DIR}/hidden.qcow2`);
    });

    it('drops characters outside the allow-list', () => {
        expect(safeUploadPath('a b;c$d.qcow2'))
            .toBe(`${UPLOAD_DIR}/a_b_c_d.qcow2`);
    });

    it.each([
        ['only dots', '...'],
        ['empty name', ''],
        ['trailing slash', 'some/dir/'],
        ['undefined', undefined],
        ['null', null],
    ])('refuses a name that leaves nothing safe (%s)', (_label, name) => {
        expect(safeUploadPath(name)).toBeNull();
    });
});
