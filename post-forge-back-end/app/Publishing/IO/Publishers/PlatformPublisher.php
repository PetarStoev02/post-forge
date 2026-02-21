<?php

declare(strict_types=1);

namespace App\Publishing\IO\Publishers;

use App\Posts\Entities\Models\Post;
use App\SocialAccounts\Entities\Models\SocialAccount;

interface PlatformPublisher
{
    /**
     * Publish a post to the platform.
     *
     * @return string The platform post ID
     */
    public function publish(Post $post, SocialAccount $account): string;
}
