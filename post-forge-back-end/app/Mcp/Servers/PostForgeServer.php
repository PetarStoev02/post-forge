<?php

namespace App\Mcp\Servers;

use App\Mcp\Tools\ListSocialAccountsTool;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('Post Forge Server')]
#[Version('0.0.1')]
#[Instructions('PostForge MCP server for localhost development. Use tools to list connected social accounts.')]
class PostForgeServer extends Server
{
    protected array $tools = [
        ListSocialAccountsTool::class,
    ];

    protected array $resources = [
        //
    ];

    protected array $prompts = [
        //
    ];
}
