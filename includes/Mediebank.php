<?php

defined( 'ABSPATH' ) || exit;

class Mediebank {
    private static ?Mediebank $instance = null;

    public static array $providers = [
        [
            "id"             => "mb",
            "name"           => "Mediebank",
            "archive"        => 'mb',
            "informationUrl" => "https://www.ntb.no/bilder/mediebank"
        ],
        [
            "id"             => "ntb-marketplace",
            "name"           => "NTB Marketplace",
            "archive"        => 'ntb',
            "informationUrl" => "https://www.ntb.no/bilder/bildeportal"
        ],
        [
            "id"             => "tt-marketplace",
            "name"           => "TT Marketplace",
            "archive"        => 'tt',
            "informationUrl" => "https://tt.se/om/bild/mediebank"
        ]
    ];

    /**
     * Returns the *Singleton* instance of this class.
     *
     * @return Mediebank
     */
    public static function get_instance(): Mediebank {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Private clone method to prevent cloning of the instance of the
     * *Singleton* instance.
     *
     * @return void
     */
    private function __clone() {
    }

    /**
     * Private un-serialize method to prevent un-serializing of the *Singleton*
     * instance.
     *
     * @return void
     */
    public function __wakeup() {
    }

    /**
     * Protected constructor to prevent creating a new instance of the
     * *Singleton* via the `new` operator from outside of this class.
     */
    private function __construct() {
        $this->init();
    }

    public function init(): void {
        add_filter( 'plugin_action_links_' . plugin_basename( MEDIEBANK_INTEGRATION_PLUGIN_PATH ) . '/mediebank.php', [
            $this,
            'plugin_action_links'
        ] );

        add_action( 'save_post', [ $this, 'save_post' ], 10, 2 );

        if ( ! wp_next_scheduled( 'mediebank_report_asset_usages' ) ) {
            wp_schedule_event( time(), 'hourly', 'mediebank_report_asset_usages' );
        }

//        $this->report_asset_usages();

        add_action( 'mediebank_report_asset_usages', [
            $this,
            'report_asset_usages'
        ] );

        if ( is_admin() ) {
            add_action( 'admin_init', [ $this, 'admin_init' ] );
            add_action( 'admin_menu', [ $this, 'admin_menu' ] );
        }
    }

    public function admin_init(): void {
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_admin_scripts' ] );
        add_action( 'wp_enqueue_media', [ $this, 'enqueue_media' ] );
        add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_block_editor_assets' ] );
        add_filter( 'media_meta', [ $this, 'add_attachment_info' ], 10, 2 );

        add_filter( 'media_upload_tabs', [ $this, 'add_media_upload_tab' ] );
        add_action( 'media_upload_mediebank_tab', [ $this, 'mediebank_media_upload_handler' ] );
        add_filter( 'media_buttons', [ $this, 'media_buttons' ] );

        $this->remove_notices();
    }

    /**
     * Adds plugin action links.
     *
     * @since 1.0.0
     * @version 4.0.0
     */
    public function plugin_action_links( $links ): array {
        $plugin_links = [
            '<a href="options-general.php?page=mediebank-options">' . esc_html__( 'Settings', 'mediebank' ) . '</a>',
        ];

        return array_merge( $plugin_links, $links );
    }

    public function admin_menu(): void {
        add_options_page(
            __( 'Mediebank', 'mediebank' ),
            __( 'Mediebank', 'mediebank' ),
            'manage_options',
            'mediebank-options',
            [ $this, 'render_settings_page' ],
        );

//        add_submenu_page(
//            'upload.php',
//            __( 'Mediebank', 'mediebank' ),
//            __( 'Mediebank', 'mediebank' ),
//            'upload_files',
//            'mediebank-gallery',
//            [ $this, 'render_gallery_page' ],
//            2
//        );

        add_menu_page(
            __( 'Mediebank', 'mediebank' ),
            __( 'Mediebank', 'mediebank' ),
            'upload_files',
            'mediebank-gallery',
            [ $this, 'render_gallery_page' ],
            MEDIEBANK_INTEGRATION_PLUGIN_URL . '/assets/images/icon-32.png',
            25
        );
    }

    public function enqueue_admin_scripts(): void {
        wp_enqueue_style(
            'mediebank-integration',
            MEDIEBANK_INTEGRATION_PLUGIN_URL . '/assets/build/index.css',
            [],
            filemtime( MEDIEBANK_INTEGRATION_PLUGIN_PATH . '/assets/build/index.css' )
        );

        $asset = require MEDIEBANK_INTEGRATION_PLUGIN_PATH . '/assets/build/index.asset.php';

        wp_enqueue_script(
            'mediebank-integration',
            MEDIEBANK_INTEGRATION_PLUGIN_URL . '/assets/build/index.js',
            $asset['dependencies'],
            filemtime( MEDIEBANK_INTEGRATION_PLUGIN_PATH . '/assets/build/index.js' ),
            true
        );

        wp_set_script_translations( 'mediebank-integration', 'mediebank', MEDIEBANK_INTEGRATION_PLUGIN_PATH . '/languages' );
    }

    public function enqueue_media(): void {
        $this->enqueue_admin_scripts();
    }

    public function enqueue_block_editor_assets(): void {
        $source = "wp-blocks-media-frame";

        include_once MEDIEBANK_INTEGRATION_PLUGIN_PATH . "/includes/shared/localize-gallery.php";
    }

    public static function get_options(): array {
        return get_option( Mediebank_Helper::OPTIONS_NAME, [] );
    }

    public function remove_notices(): void {
        global $wp_filter;

        // Clear all ugly admin notices, so we get a clean gallery page
        $our_pages = [ 'mediebank-gallery', 'mediebank-options' ];

        if ( isset( $wp_filter['admin_notices'] ) && isset( $_GET['page'] ) && in_array( $_GET['page'], $our_pages ) ) {
            unset( $wp_filter['admin_notices'] );
        }
    }

    public function render_settings_page(): void {
        include_once MEDIEBANK_INTEGRATION_PLUGIN_PATH . '/includes/pages/settings.php';
    }

    public function render_gallery_page(): void {
        include_once MEDIEBANK_INTEGRATION_PLUGIN_PATH . '/includes/pages/gallery.php';
    }

    public function add_attachment_info( $media_dims, $post ) {
        $mediebank_id = get_post_meta( $post->ID, Mediebank_Helper::META_ATTACHMENT_ID, true );

        if ( ! empty( $mediebank_id ) ) {
            $media_dims .= '<span><strong>' . __( 'Mediebank ID', 'mediebank' ) . '</strong> ' . $mediebank_id . '</span>';
        }

        return $media_dims;
    }

    public function save_post( $post_id, $post ): void {
        global $wpdb;

        $post_url = get_permalink( $post );

        $mediaRegex = "/(src|href)=\"((.+?).(jpg|jpeg|png|pdf|mp4))\"/i";
        preg_match_all( $mediaRegex, $post->post_content, $matches );

        $found_assets = [];

        $thumbnail_id = get_post_thumbnail_id( $post );
        if ( ! empty( $thumbnail_id ) ) {
            $thumbnail_url = wp_get_attachment_image_url( $thumbnail_id, 'full' );
            $mediebank_id  = get_post_meta( $thumbnail_id, Mediebank_Helper::META_ATTACHMENT_ID, true );

            $asset_in_library = ! empty( $wpdb->get_results(
                $wpdb->prepare( "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = %s AND meta_value = %s LIMIT 1", Mediebank_Helper::META_ATTACHMENT_ID, $mediebank_id ),
                ARRAY_A
            ) );

            if ( $asset_in_library ) {
                $found_assets[ $mediebank_id ] = [
                    'mediebank_id' => $mediebank_id,
                    'post_url'     => $post_url,
                    'asset_url'    => $thumbnail_url,
                ];
            }
        }

        foreach ( $matches[2] as $url ) {
            $uploads_base_path = str_replace( wp_upload_dir()['subdir'], "", wp_upload_dir()['url'] );

            // If it's a Mediebank image the first part of the image before a dash will always be the Mediebank ID.
            $sub_url      = str_replace( $uploads_base_path, "", $url );
            $image_parts  = explode( '-', $sub_url );
            $image_parts  = explode( '/', $image_parts[0] );
            $mediebank_id = array_pop( $image_parts );

            // Verify that this is actually an asset we have in our DB
            $asset_in_library = ! empty( $wpdb->get_results(
                $wpdb->prepare( "SELECT post_id FROM $wpdb->postmeta WHERE meta_key = %s AND meta_value = %s LIMIT 1", Mediebank_Helper::META_ATTACHMENT_ID, $mediebank_id ),
                ARRAY_A
            ) );

            if ( empty( $mediebank_id )
                 || ! $asset_in_library
                 || isset( $found_assets[ $mediebank_id ] ) ) {
                continue;
            }

            $found_assets[ $mediebank_id ] = [
                'mediebank_id' => $mediebank_id,
                'post_url'     => $post_url,
                'asset_url'    => $url,
            ];
        }

        // Set some post meta on this post, so we know to check it in a scheduled event
        Mediebank_Helper::set_pending_usage_report( $post_id, $found_assets );
    }

    /**
     * @throws Exception
     */
    public function report_asset_usages(): void {
        $query = new WP_Query( [
            'post_type'  => 'post',
            'fields'     => 'ids',
            'meta_query' => [
                [
                    'key'     => Mediebank_Helper::META_POST_PENDING_USAGE_REPORT,
                    'compare' => '=',
                    'value'   => 1
                ]
            ]
        ] );

        $api = Mediebank_Api::get_instance();

        foreach ( $query->get_posts() as $post_id ) {
            $assets = get_post_meta( $post_id, Mediebank_Helper::META_POST_ASSET_USAGES, true );

            foreach ( $assets as $asset ) {
                $api->report_usage( $post_id, $asset['mediebank_id'], $asset['post_url'] );
            }

            Mediebank_Helper::complete_usage_report( $post_id );
        }
    }

    // Classic editor hooks
    public function add_media_upload_tab( array $tabs ): array {
        return array_merge( $tabs, [ 'mediebank_tab' => __( 'Mediebank', 'mediebank' ) ] );
    }

    public function media_buttons(): void {
        echo '<a href="' . esc_attr( add_query_arg( 'tab', 'mediebank_tab', esc_url( get_upload_iframe_src() ) ) ) . '" 
		    class="thickbox button" 
		    title="' . esc_attr__( 'Mediebank', 'mediebank' ) . '">
		    &nbsp;' . esc_html__( 'Mediebank', 'mediebank' ) . '&nbsp;
        </a>';
    }

    public function render_gallery_page_iframe(): void {
        $source = "classic-iframe";

        include_once MEDIEBANK_INTEGRATION_PLUGIN_PATH . '/includes/pages/gallery.php';
    }

    public function mediebank_media_upload_handler(): void {
        wp_iframe( [ $this, 'render_gallery_page_iframe' ] );
    }
    // End classic editor hooks
}
