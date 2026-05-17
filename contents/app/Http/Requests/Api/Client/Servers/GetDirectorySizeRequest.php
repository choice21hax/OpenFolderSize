<?php

namespace Pterodactyl\BlueprintFramework\Extensions\openfoldersize\Http\Requests\Api\Client\Servers;

use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class GetDirectorySizeRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_READ;
    }

    public function rules(): array
    {
        return [
            'path' => ['required', 'string', 'max:4096'],
            'refresh' => ['sometimes', 'boolean'],
        ];
    }
}
