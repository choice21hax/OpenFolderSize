<?php

namespace Pterodactyl\BlueprintFramework\Extensions\openfoldersize\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\BlueprintFramework\Extensions\openfoldersize\Services\OpenFolderSizeService;
use Pterodactyl\BlueprintFramework\Extensions\openfoldersize\Http\Requests\Api\Client\Servers\GetDirectorySizeRequest;

class OpenFolderSizeController extends ClientApiController
{
    public function __construct(
        private OpenFolderSizeService $service,
    ) {
        parent::__construct();
    }

    public function __invoke(GetDirectorySizeRequest $request, Server $server): array
    {
        set_time_limit(300);

        return $this->service->get(
            $server,
            $request->string('path')->toString(),
            $request->boolean('refresh')
        );
    }
}
