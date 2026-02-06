<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Social Platform Configurations
    |--------------------------------------------------------------------------
    |
    | Configuration for each supported social media platform including
    | character limits, media rules, and API settings.
    |
    */

    'twitter' => [
        'name' => 'Twitter/X',
        'character_limit' => 280,
        'media_rules' => [
            'max_images' => 4,
            'max_videos' => 1,
            'max_image_size' => 5 * 1024 * 1024, // 5MB
            'max_video_size' => 512 * 1024 * 1024, // 512MB
            'allowed_types' => ['image', 'video', 'gif'],
            'image_formats' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            'video_formats' => ['mp4', 'mov'],
        ],
        'api_version' => 'v2',
    ],

    'facebook' => [
        'name' => 'Facebook',
        'character_limit' => 63206,
        'media_rules' => [
            'max_images' => 10,
            'max_videos' => 1,
            'max_image_size' => 10 * 1024 * 1024, // 10MB
            'max_video_size' => 4 * 1024 * 1024 * 1024, // 4GB
            'allowed_types' => ['image', 'video'],
            'image_formats' => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'],
            'video_formats' => ['mp4', 'mov', 'avi'],
        ],
        'api_version' => 'v18.0',
    ],

    'instagram' => [
        'name' => 'Instagram',
        'character_limit' => 2200,
        'hashtag_limit' => 30,
        'media_rules' => [
            'max_images' => 10, // Carousel
            'max_videos' => 1,
            'max_image_size' => 8 * 1024 * 1024, // 8MB
            'max_video_size' => 100 * 1024 * 1024, // 100MB for feed, 4GB for IGTV
            'allowed_types' => ['image', 'video'],
            'image_formats' => ['jpg', 'jpeg', 'png'],
            'video_formats' => ['mp4', 'mov'],
            'aspect_ratios' => [
                'min' => 0.8, // 4:5
                'max' => 1.91, // 1.91:1
            ],
        ],
        'api_version' => 'v18.0',
    ],

    'linkedin' => [
        'name' => 'LinkedIn',
        'character_limit' => 3000,
        'media_rules' => [
            'max_images' => 9,
            'max_videos' => 1,
            'max_image_size' => 8 * 1024 * 1024, // 8MB
            'max_video_size' => 200 * 1024 * 1024, // 200MB
            'allowed_types' => ['image', 'video'],
            'image_formats' => ['jpg', 'jpeg', 'png', 'gif'],
            'video_formats' => ['mp4'],
        ],
        'api_version' => '202401',
    ],

    'tiktok' => [
        'name' => 'TikTok',
        'character_limit' => 2200,
        'hashtag_limit' => 100,
        'media_rules' => [
            'max_images' => 0, // TikTok is video-first
            'max_videos' => 1,
            'max_video_size' => 287 * 1024 * 1024, // 287MB
            'allowed_types' => ['video'],
            'video_formats' => ['mp4', 'webm', 'mov'],
            'video_duration' => [
                'min' => 3,
                'max' => 600, // 10 minutes
            ],
        ],
        'api_version' => 'v2',
    ],

    /*
    |--------------------------------------------------------------------------
    | Publishing Settings
    |--------------------------------------------------------------------------
    */

    'publishing' => [
        'max_retries' => 3,
        'retry_delay' => 300, // 5 minutes
        'batch_size' => 10, // Posts per batch
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    */

    'rate_limits' => [
        'twitter' => [
            'posts_per_day' => 2400,
            'posts_per_15_min' => 300,
        ],
        'facebook' => [
            'posts_per_day' => 50,
        ],
        'instagram' => [
            'posts_per_day' => 25,
        ],
        'linkedin' => [
            'posts_per_day' => 100,
        ],
        'tiktok' => [
            'posts_per_day' => 50,
        ],
    ],
];
