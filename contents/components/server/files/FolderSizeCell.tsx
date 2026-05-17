import React, { MouseEvent, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalculator, faExclamationTriangle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { httpErrorToHuman } from '@/api/http';
import { bytesToString } from '@/lib/formatters';
import getDirectorySize, {
    DirectorySizeResult,
    getCachedDirectorySize,
} from '../../api/getDirectorySize';

type Status = 'idle' | 'loading' | 'error';

interface Props {
    serverUuid: string;
    path: string;
}

const stopRowNavigation = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
};

const FolderSizeCell = ({ serverUuid, path }: Props) => {
    const cacheKey = useMemo(() => `${serverUuid}:${path}`, [serverUuid, path]);
    const [result, setResult] = useState<DirectorySizeResult | null>(() => getCachedDirectorySize(serverUuid, path) ?? null);
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setResult(getCachedDirectorySize(serverUuid, path) ?? null);
        setStatus('idle');
        setError(null);
    }, [cacheKey, path, serverUuid]);

    const calculate = async (event: MouseEvent<HTMLButtonElement>) => {
        stopRowNavigation(event);

        if (status === 'loading') {
            return;
        }

        setStatus('loading');
        setError(null);

        try {
            const nextResult = await getDirectorySize(serverUuid, path);
            setResult(nextResult);
            setStatus('idle');
        } catch (caught) {
            setStatus('error');
            setError(httpErrorToHuman(caught));
        }
    };

    if (result) {
        const title = `${result.files_scanned} files across ${result.directories_scanned} folders`;

        return (
            <span className="ofs-size-value" data-cached={result.cached ? 'true' : 'false'} title={title}>
                {bytesToString(result.bytes)}
            </span>
        );
    }

    if (status === 'loading') {
        return (
            <button
                type="button"
                className="ofs-size-button"
                data-state="loading"
                onClick={stopRowNavigation}
                aria-disabled="true"
            >
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Calculating</span>
            </button>
        );
    }

    if (status === 'error') {
        return (
            <button
                type="button"
                className="ofs-size-button"
                data-state="error"
                onClick={calculate}
                title={error ?? 'Unable to calculate directory size.'}
            >
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>Retry</span>
            </button>
        );
    }

    return (
        <button type="button" className="ofs-size-button" onClick={calculate}>
            <FontAwesomeIcon icon={faCalculator} />
            <span>Calculate</span>
        </button>
    );
};

export default FolderSizeCell;
