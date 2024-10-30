<?php

defined( 'ABSPATH' ) || exit;

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

include_once "includes/Mediebank_Helper.php";

delete_option(Mediebank_Helper::OPTIONS_CONFIGURED);
delete_option(Mediebank_Helper::OPTIONS_NAME);
