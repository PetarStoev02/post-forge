<?php

use App\Mcp\Servers\PostForgeServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::web('/mcp/postforge', PostForgeServer::class);
