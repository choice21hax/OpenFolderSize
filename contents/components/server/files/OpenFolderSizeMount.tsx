import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileObject } from '@/api/server/files/loadDirectory';
import styles from '@/components/server/files/style.module.css';
import { ServerContext } from '@/state/server';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import FolderSizeCell from './FolderSizeCell';

interface MountPoint {
    key: string;
    path: string;
    container: HTMLElement;
}

interface VisibleDirectory {
    key: string;
    path: string;
}

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));

    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1].name);
};

const normalizePath = (path: string): string => {
    const strippedPath = path.replace(/\\/g, '/').trim().replace(/^[~$]+(?=\/|$)/, '');
    const normalizedSegments = strippedPath
        .split('/')
        .filter((segment) => segment !== '' && segment !== '.')
        .reduce<string[]>((segments, segment) => {
            if (segment === '..') {
                segments.pop();

                return segments;
            }

            segments.push(segment);

            return segments;
        }, []);

    return normalizedSegments.length ? `/${normalizedSegments.join('/')}` : '/';
};

const getFileKey = (file: FileObject): string => file.key ?? `${file.isFile ? 'file' : 'dir'}_${file.name}`;

const joinPath = (directory: string, name: string) => {
    const root = normalizePath(directory);

    return normalizePath(`${root === '/' ? '' : root}/${name.replace(/^\/+/, '')}`);
};

const removeUnusedSlots = (activeKeys?: Set<string>) => {
    document.querySelectorAll<HTMLElement>('[data-openfoldersize-slot]').forEach((slot) => {
        const key = slot.getAttribute('data-openfoldersize-slot');
        if (!key || !activeKeys || !activeKeys.has(key)) {
            slot.remove();
        }
    });
};

const areMountsEqual = (left: MountPoint[], right: MountPoint[]): boolean =>
    left.length === right.length &&
    left.every(
        (mount, index) =>
            mount.key === right[index].key &&
            mount.path === right[index].path &&
            mount.container === right[index].container
    );

const OpenFolderSizeMount = () => {
    const serverUuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { data: files } = useFileManagerSwr();
    const [mounts, setMounts] = useState<MountPoint[]>([]);

    const visibleDirectories = useMemo<VisibleDirectory[]>(
        () =>
            sortFiles((files ?? []).slice(0, 250))
                .filter((file) => !file.isFile)
                .map((file) => ({
                    key: getFileKey(file),
                    path: joinPath(directory, file.name),
                })),
        [directory, files]
    );

    useEffect(() => {
        return () => {
            removeUnusedSlots();
        };
    }, []);

    useLayoutEffect(() => {
        let frame = 0;

        const reconcile = () => {
            if (!visibleDirectories.length) {
                removeUnusedSlots();
                setMounts((current) => (current.length ? [] : current));

                return;
            }

            const rows = Array.from(document.querySelectorAll<HTMLElement>(`.${styles.file_row}`));
            const nextMounts: MountPoint[] = [];
            const activeKeys = new Set<string>();

            visibleDirectories.forEach((file, index) => {
                const row = rows[index];
                if (!row) {
                    return;
                }

                const details = row.querySelector<HTMLElement>(`.${styles.details}, .details`);
                if (!details) {
                    return;
                }

                let slot =
                    details.querySelector<HTMLElement>(`[data-openfoldersize-slot="${file.key}"]`) ??
                    row.querySelector<HTMLElement>(`[data-openfoldersize-slot="${file.key}"]`);

                if (!slot) {
                    slot = document.createElement('div');
                    slot.className = 'ofs-size-cell';
                    slot.setAttribute('data-openfoldersize-slot', file.key);
                }

                if (slot.parentElement !== details) {
                    const anchor = details.lastElementChild && details.lastElementChild !== slot ? details.lastElementChild : null;

                    if (anchor) {
                        details.insertBefore(slot, anchor);
                    } else {
                        details.appendChild(slot);
                    }
                }

                activeKeys.add(file.key);
                nextMounts.push({
                    key: file.key,
                    path: file.path,
                    container: slot,
                });
            });

            removeUnusedSlots(activeKeys);
            setMounts((current) => (areMountsEqual(current, nextMounts) ? current : nextMounts));
        };

        const scheduleReconcile = () => {
            if (frame) {
                window.cancelAnimationFrame(frame);
            }

            frame = window.requestAnimationFrame(() => {
                frame = 0;
                reconcile();
            });
        };

        scheduleReconcile();

        const observerRoot = document.querySelector<HTMLElement>(`.${styles.file_row}`)?.parentElement ?? document.body;
        const observer = new MutationObserver(scheduleReconcile);
        observer.observe(observerRoot, { childList: true, subtree: true });

        return () => {
            if (frame) {
                window.cancelAnimationFrame(frame);
            }

            observer.disconnect();
        };
    }, [visibleDirectories]);

    return (
        <>
            {mounts.map((mount) =>
                createPortal(<FolderSizeCell serverUuid={serverUuid} path={mount.path} />, mount.container, mount.key)
            )}
        </>
    );
};

export default OpenFolderSizeMount;
