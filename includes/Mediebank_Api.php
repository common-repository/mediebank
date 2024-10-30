<?php

defined( 'ABSPATH' ) || exit;

class Mediebank_Api {
    private static ?Mediebank_Api $instance = null;

    private string $auth_api_url = "https://login.sdl.no/oauth/token";

    private string $api_url = "https://api.ntb.no/media/v1/{provider}";

    private string $internal_api_url = "https://mediebank.ntb.no/api/v1";

    private string $audience = "https://api.ntb.no";

    /**
     * Returns the *Singleton* instance of this class.
     *
     * @return Mediebank_Api
     */
    public static function get_instance(): Mediebank_Api {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function __construct() {
        $options = Mediebank::get_options();

        if ( ! isset( $options['provider'] ) ) {
            return;
        }

        // todo: remove after a while
        if ( $options['provider'] === 'ntb' ) {
            $options['provider'] = 'mb';
        }

        $providers = array_filter( Mediebank::$providers, function ( $item ) use ( $options ) {
            return $item['id'] === $options['provider'];
        } );
        $provider  = array_pop( $providers );

        $this->api_url = str_replace( '{provider}', $provider['archive'], $this->api_url );
    }

    /**
     * @throws Exception
     */
    public function get_access_token( bool $force_fresh = false ) {
        $stored = get_transient( Mediebank_Helper::TRANSIENT_ACCESS_TOKEN );

        if ( ! $force_fresh && $stored ) {
            return $stored['access_token'];
        }

        $options  = ( Mediebank::get_instance() )->get_options();
        $home_url = home_url();

        $args = [
            'method'  => 'POST',
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/x-www-form-urlencoded',
                'User-Agent'   => "Mediebank WordPress Plugin ($home_url)",
            ],
            'body'    => [
                'grant_type'    => 'client_credentials',
                'client_secret' => $options['apiClientSecret'],
                'client_id'     => $options['apiClientId'],
                'audience'      => $this->audience
            ],
        ];

        $response = wp_remote_post( $this->auth_api_url, $args );

        if ( is_wp_error( $response ) ) {
            throw new Exception( $response->get_error_message() );
        }

        $token = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( ! $token || isset( $token["error"] ) ) {
            return null;
        }

        set_transient( Mediebank_Helper::TRANSIENT_ACCESS_TOKEN, $token, ( $token['expires_in'] - 300 ) );

        return $token['access_token'];
    }

    /**
     * @throws Exception
     */
    public function get_user(): array {
        return $this->http_call( "$this->internal_api_url/user", "GET" );
    }

    /**
     * @throws Exception
     */
    public function get_assets( array $params ): array {
        $query_string = http_build_query( $params );

        return $this->http_call( "$this->api_url/?$query_string", "GET" );
    }

    /**
     * @throws Exception
     */
    public function get_asset( $id ): array {
        return $this->http_call( "$this->api_url/$id", "GET" );
    }

    /**
     * @throws Exception
     */
    public function download_assets( array $ids ) {
        $query_string = http_build_query( [
            'ids' => $ids
        ], encoding_type: PHP_QUERY_RFC3986 );

        return $this->http_call( "$this->api_url/download/?$query_string", "GET" );
    }

    /**
     * @throws Exception
     */
    public function download_asset( string $id ) {
        return $this->http_call( "$this->api_url/download/$id", "GET" );
    }

    /**
     * @throws Exception
     */
    public function report_usage( int $post_id, string $mediebank_id, string $published_url ) {
        $post = get_post( $post_id );

        $publication = get_option( 'blogname' );
        $cms_url     = home_url();
        $cms_key     = "WORDPRESS_" . get_bloginfo( 'version' );

        $data = [
            'id'           => $mediebank_id,
            'articleId'    => $post_id,
            'cmsUrl'       => $cms_url,
            'cmsKey'       => $cms_key,
            'publishedUrl' => $published_url,
            'publication'  => $publication,
            'timestamp'    => $post->post_date
        ];

        return $this->http_call( "$this->api_url/usage/article", "POST", $data );
    }

    /**
     * @throws Exception
     */
    private function http_call( string $url, string $method, array $data = [], array $headers = [] ) {
        $home_url = home_url();

        $headers = array_merge( [
            'Content-Type'  => 'application/json',
            'User-Agent'    => "Mediebank WordPress Plugin ($home_url)",
            'Authorization' => 'Bearer ' . $this->get_access_token()
        ], $headers );

        $body = $method === 'GET' ? $data : json_encode( $data );

        $args = [
            'method'  => $method,
            'timeout' => 30,
            'headers' => $headers,
            'body'    => $body,
        ];

        $response = wp_remote_post( $url, $args );

        if ( is_wp_error( $response ) ) {
            throw new Exception( $response->get_error_message() );
        }

        $is_json_response = str_contains( $response['headers']['content-type'], "application/json" );
        $body             = wp_remote_retrieve_body( $response );

        if ( $is_json_response ) {
            return json_decode( $body, true );
        }

        return $body;
    }
}
