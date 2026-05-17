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
        const title = 'Calculating file size';

        return (
            <button
                type="button"
                className="ofs-size-button"
                data-state="loading"
                onClick={stopRowNavigation}
                aria-disabled="true"
                aria-label={title}
                title={title}
            >
                <FontAwesomeIcon icon={faSpinner} spin />
            </button>
        );
    }

    if (status === 'error') {
        const title = error ? `Retry calculating file size: ${error}` : 'Retry calculating file size';

        return (
            <button
                type="button"
                className="ofs-size-button"
                data-state="error"
                onClick={calculate}
                aria-label={title}
                title={title}
            >
                <FontAwesomeIcon icon={faExclamationTriangle} />
            </button>
        );
    }

    const title = 'Calculate file size';

    return (
        <button type="button" className="ofs-size-button" onClick={calculate} aria-label={title} title={title}>
            <FontAwesomeIcon icon={faCalculator} />
        </button>
    );
};

export default FolderSizeCell;
