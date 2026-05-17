<?php

namespace Pterodactyl\BlueprintFramework\Extensions\openfoldersize\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\BlueprintFramework\Extensions\openfoldersize\Services\OpenFolderSizeService;
use Pterodactyl\BlueprintFramework\Extensions\openfoldersize\Http\Requests\Api\Client\Servers\GetDirectorySizeRequest;

class OpenFolderSizeController extends ClientApiController
{
    private OpenFolderSizeService $service;

    public function __construct(OpenFolderSizeService $service)
    {
        parent::__construct();
        $this->service = $service;
    }

    public function __invoke(GetDirectorySizeRequest $request, Server $server): array
    {
        set_time_limit(300);

        return $this->service->get(
            $server,
            (string) $request->input('path', '/'),
            filter_var($request->input('refresh', false), FILTER_VALIDATE_BOOLEAN)
        );
    }
}
