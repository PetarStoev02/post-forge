<?php

namespace App\Mcp\Tools;

use App\SocialAccounts\Entities\Models\Workspace;
use App\SocialAccounts\UseCases\ListSocialAccountsInteractor;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\ResponseFactory;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Lists connected social accounts for the default workspace (platform, id, workspace). Use for localhost dev to see what accounts are connected.')]
class ListSocialAccountsTool extends Tool
{
    public function __construct(
        private ListSocialAccountsInteractor $listInteractor,
    ) {}

    /**
     * Handle the tool request.
     *
     * @return Response|ResponseFactory
     */
    public function handle(Request $request): Response|ResponseFactory
    {
        $accounts = $this->listInteractor->execute(Workspace::default()->id);

        $summary = $accounts->map(fn ($account) => [
            'id' => $account->id,
            'platform' => strtoupper($account->platform),
            'workspaceId' => $account->workspace_id,
            'platformUserId' => $account->platform_user_id,
        ])->values()->all();

        return Response::structured([
            'count' => count($summary),
            'accounts' => $summary,
        ]);
    }

    /**
     * Get the tool's input schema.
     *
     * @return array<string, \Illuminate\Contracts\JsonSchema\JsonSchema>
     */
    public function schema(JsonSchema $schema): array
    {
        return [];
    }
}
