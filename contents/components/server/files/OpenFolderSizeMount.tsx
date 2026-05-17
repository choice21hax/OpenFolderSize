import React, { useEffect, useMemo, useState } from 'react';
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

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));

    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1].name);
};

const joinPath = (directory: string, name: string) => {
    const root = directory === '/' ? '' : directory.replace(/\/+$/, '');

    return `${root}/${name.replace(/^\/+/, '')}`;
};

const OpenFolderSizeMount = () => {
    const serverUuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { data: files } = useFileManagerSwr();
    const [mounts, setMounts] = useState<MountPoint[]>([]);

    const visibleFiles = useMemo(() => sortFiles((files ?? []).slice(0, 250)), [files]);

    useEffect(() => {
        return () => {
            document
                .querySelectorAll<HTMLElement>('[data-openfoldersize-slot]')
                .forEach((slot) => slot.remove());
        };
    }, []);

    useEffect(() => {
        if (!visibleFiles.length) {
            document
                .querySelectorAll<HTMLElement>('[data-openfoldersize-slot]')
                .forEach((slot) => slot.remove());
            setMounts([]);

            return;
        }

        const rows = Array.from(document.querySelectorAll<HTMLElement>(`.${styles.file_row}`));
        const nextMounts: MountPoint[] = [];
        const activeKeys = new Set<string>();

        // Mirror the core file ordering so each folder maps to the correct DOM row.
        visibleFiles.forEach((file, index) => {
            if (file.isFile) {
                return;
            }

            const row = rows[index];
            if (!row) {
                return;
            }

            const details = row.querySelector<HTMLElement>(`.${styles.details}`);
            if (!details) {
                return;
            }

            let slot = row.querySelector<HTMLElement>(`[data-openfoldersize-slot="${file.key}"]`);
            if (!slot) {
                slot = document.createElement('div');
                slot.className = 'ofs-size-cell';
                slot.setAttribute('data-openfoldersize-slot', file.key);

                if (details.lastElementChild) {
                    details.insertBefore(slot, details.lastElementChild);
                } else {
                    details.appendChild(slot);
                }
            }

            activeKeys.add(file.key);
            nextMounts.push({
                key: file.key,
                path: joinPath(directory, file.name),
                container: slot,
            });
        });

        document.querySelectorAll<HTMLElement>('[data-openfoldersize-slot]').forEach((slot) => {
            const key = slot.getAttribute('data-openfoldersize-slot');
            if (key && !activeKeys.has(key)) {
                slot.remove();
            }
        });

        setMounts(nextMounts);
    }, [directory, visibleFiles]);

    return (
        <>
            {mounts.map((mount) =>
                createPortal(<FolderSizeCell serverUuid={serverUuid} path={mount.path} />, mount.container, mount.key)
            )}
        </>
    );
};

export default OpenFolderSizeMount;
