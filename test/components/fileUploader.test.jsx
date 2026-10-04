/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import cockpit from 'cockpit';
import FileUploader from '../../src/components/fileUploader.jsx';
import { UPLOAD_DIR } from '../../src/lib/uploadPath.js';

function renderUploader() {
    const handleCallback = vi.fn();
    const ref = React.createRef();
    const view = render(
        <FileUploader ref={ref} handleCallback={handleCallback} fileExtension=".qcow2" />
    );
    return { handleCallback, view, ref };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('FileUploader', () => {
    it('uploads a file to the plugin directory and reports completion', async () => {
        cockpit.spawn.mockResolvedValue('');
        const { handleCallback, view } = renderUploader();
        const input = view.container.querySelector('input[type="file"]');

        await userEvent.upload(input, new File(['hello'], 'disk.qcow2'));

        await waitFor(() => expect(cockpit.spawn).toHaveBeenCalledWith(
            ['install', '-d', '-m', '0700', UPLOAD_DIR],
            { superuser: 'try' }
        ));
        await waitFor(() => expect(cockpit.channel).toHaveBeenCalled());
        expect(cockpit.channel.mock.calls[0][0]).toMatchObject({
            payload: 'fsreplace1',
            path: `${UPLOAD_DIR}/disk.qcow2`,
        });

        act(() => cockpit.lastChannel().emit('ready'));

        await waitFor(() => expect(handleCallback).toHaveBeenCalledWith(
            `${UPLOAD_DIR}/disk.qcow2`, '.qcow2', 100
        ));
        expect(cockpit.lastChannel().send).toHaveBeenCalled();
        expect(cockpit.lastChannel().control).toHaveBeenCalledWith({ command: 'done' });
    });

    it('sends a large file in several chunks', async () => {
        cockpit.spawn.mockResolvedValue('');
        const { handleCallback, view } = renderUploader();
        const input = view.container.querySelector('input[type="file"]');
        const file = new File([new Uint8Array(200 * 1024)], 'disk.qcow2');

        await userEvent.upload(input, file);
        await waitFor(() => expect(cockpit.channel).toHaveBeenCalled());

        act(() => cockpit.lastChannel().emit('ready'));

        await waitFor(() => expect(cockpit.lastChannel().control).toHaveBeenCalledWith({ command: 'done' }));
        // 200 KiB at the 64 KiB chunk size means four chunks, sliced in order.
        const sentLengths = cockpit.lastChannel().send.mock.calls.map(([data]) => data.length);
        expect(sentLengths).toEqual([65536, 65536, 65536, 8192]);
        expect(handleCallback).toHaveBeenCalledWith(`${UPLOAD_DIR}/disk.qcow2`, '.qcow2', 100);
    });

    it('refuses to upload a file whose name leaves nothing safe', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { handleCallback, ref } = renderUploader();

        act(() => ref.current.setState({ file: new File(['x'], '...') }));
        act(() => ref.current.uploadFile());

        expect(console.error).toHaveBeenCalled();
        expect(cockpit.spawn).not.toHaveBeenCalled();
        expect(handleCallback).not.toHaveBeenCalled();
    });

    it('logs an error when the upload directory cannot be created', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        cockpit.spawn.mockRejectedValue(new Error('denied'));
        const { view } = renderUploader();
        const input = view.container.querySelector('input[type="file"]');

        await userEvent.upload(input, new File(['x'], 'disk.qcow2'));

        await waitFor(() => expect(console.error).toHaveBeenCalledWith(
            'Error creating the upload directory:', expect.any(Error)
        ));
        expect(cockpit.channel).not.toHaveBeenCalled();
    });

    it('opens the file picker from the button', () => {
        const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
        renderUploader();

        fireEvent.click(screen.getByRole('button', { name: '+' }));

        expect(clickSpy).toHaveBeenCalled();
    });
});
