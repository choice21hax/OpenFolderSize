<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\openfoldersize\Http\Controllers\Api\Client\Servers\OpenFolderSizeController;

Route::get('/servers/{server}/directory-size', OpenFolderSizeController::class);
