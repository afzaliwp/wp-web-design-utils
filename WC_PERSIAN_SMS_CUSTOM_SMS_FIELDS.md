# Custom SMS Fields and Triggers

This plugin already exposes the right extension points, so you can add new SMS fields to:

- `پیامک مشتری` via `pwoosms_buyer_settings`
- `پیامک مدیر کل` via `pwoosms_super_admin_settings`

You do **not** need to edit the plugin core. Add your code in a custom plugin, theme `functions.php`, or a small mu-plugin.

## How it works

- Settings fields are registered through arrays in `src/Settings/Settings.php`.
- Customer messages are stored like `sms_body_{status}`.
- Super admin messages are stored like `super_admin_sms_body_{status}`.
- Sending is done with `PWSMS()->send_sms( $data )`.
- Order tags like `{b_first_name}` and `{b_last_name}` are replaced by `PWSMS()->replace_short_codes( $message, $status, $order )`.

## Add a new field under customer/admin SMS

Use the existing filters and append your own textarea field:

- customer section: `pwoosms_buyer_settings`
- admin section: `pwoosms_super_admin_settings`

The field name becomes the option key, for example:

- `custom_sms_body_review_request`
- `custom_admin_sms_body_review_request`

You can later read them with:

```php
$message = PWSMS()->get_option( 'custom_sms_body_review_request' );
```

## Add custom dynamic tags

The plugin already supports tags such as:

- `{b_first_name}`
- `{b_last_name}`
- `{order_id}`
- `{price}`

To document extra tags in the UI, use `pwoosms_shortcodes_list`.

To actually replace custom tags before sending, use:

- `pwoosms_order_sms_body_before_replace`

That filter gives you the message content before the plugin runs its own replacement. The simplest approach is to replace your custom tags there and return the final text.

## Trigger a custom SMS

For a custom event, hook into WooCommerce or WordPress, then:

1. load the saved message from your custom field
2. replace tags with `PWSMS()->replace_short_codes()`
3. send with `PWSMS()->send_sms()`

If your gateway supports pattern SMS, you can also send:

```text
pattern:YOUR_PATTERN_CODE
first_name:Ali
order_id:1234
```

That format is parsed by the gateway layer automatically.

## Example class

```php
<?php
/**
 * Example only.
 * Put this in a custom plugin or mu-plugin, not inside the main plugin files.
 */

defined( 'ABSPATH' ) || exit;

class My_PWSMS_Custom_SMS {

	public function __construct() {
		add_filter( 'pwoosms_buyer_settings', [ $this, 'add_buyer_field' ] );
		add_filter( 'pwoosms_super_admin_settings', [ $this, 'add_admin_field' ] );

		add_filter( 'pwoosms_shortcodes_list', [ $this, 'register_custom_tags_help' ] );
		add_filter( 'pwoosms_order_sms_body_before_replace', [ $this, 'replace_custom_tags' ], 10, 8 );

		add_action( 'woocommerce_order_status_completed', [ $this, 'send_review_request_sms' ] );
	}

	/**
	 * Add a new field under "پیامک مشتری".
	 */
	public function add_buyer_field( $settings ) {
		$settings[] = [
			'name'    => 'custom_sms_body_review_request',
			'label'   => 'درخواست ثبت نظر',
			'type'    => 'textarea',
			'row'     => 4,
			'default' => "سلام {b_first_name} عزیز\nسفارش {order_id} شما تکمیل شد.\nلطفا نظر خود را ثبت کنید.\nکد مشتری: {customer_first_last}",
		];

		return $settings;
	}

	/**
	 * Add a new field under "پیامک مدیر کل".
	 */
	public function add_admin_field( $settings ) {
		$settings[] = [
			'name'    => 'custom_admin_sms_body_review_request',
			'label'   => 'اطلاع مدیر برای ثبت نظر',
			'type'    => 'textarea',
			'row'     => 4,
			'default' => "سفارش {order_id} تکمیل شد برای {customer_first_last}.",
		];

		return $settings;
	}

	/**
	 * Show custom tags in the shortcode helper UI.
	 */
	public function register_custom_tags_help( $output ) {
		$output .= '<code>{customer_first_last}</code> = نام و نام خانوادگی مشتری، ';

		return $output;
	}

	/**
	 * Replace custom tags before the plugin runs its normal replacements.
	 */
	public function replace_custom_tags( $content, $find, $replace, $order_id, $order ) {
		if ( ! $order || ! is_a( $order, 'WC_Order' ) ) {
			$order = wc_get_order( $order_id );
		}

		if ( ! $order ) {
			return $content;
		}

		$custom_tags = [
			'{customer_first_last}' => trim(
				$order->get_billing_first_name() . ' ' . $order->get_billing_last_name()
			),
		];

		return str_replace( array_keys( $custom_tags ), array_values( $custom_tags ), $content );
	}

	/**
	 * Example custom trigger: send after order completion.
	 */
	public function send_review_request_sms( $order_id ) {
		$order = wc_get_order( $order_id );

		if ( ! $order || ! function_exists( 'PWSMS' ) ) {
			return;
		}

		$message_template = PWSMS()->get_option( 'custom_sms_body_review_request' );

		if ( empty( $message_template ) ) {
			return;
		}

		$message = PWSMS()->replace_short_codes( $message_template, 'completed', $order );

		$data = [
			'post_id' => $order_id,
			'mobile'  => PWSMS()->buyer_mobile( $order_id ),
			'type'    => 0,
			'message' => $message,
		];

		PWSMS()->send_sms( $data );
	}

	/**
	 * Example admin trigger for the same event.
	 */
	public function send_admin_notice( $order_id ) {
		$order = wc_get_order( $order_id );

		if ( ! $order || ! function_exists( 'PWSMS' ) ) {
			return;
		}

		$message_template = PWSMS()->get_option( 'custom_admin_sms_body_review_request' );
		$mobile           = PWSMS()->get_option( 'super_admin_phone' );

		if ( empty( $message_template ) || empty( $mobile ) ) {
			return;
		}

		$message = PWSMS()->replace_short_codes( $message_template, 'completed', $order );

		PWSMS()->send_sms( [
			'post_id' => $order_id,
			'mobile'  => $mobile,
			'type'    => 0,
			'message' => $message,
		] );
	}
}

new My_PWSMS_Custom_SMS();
```

## Summary

- Add new customer fields with `pwoosms_buyer_settings`
- Add new admin fields with `pwoosms_super_admin_settings`
- Read saved values with `PWSMS()->get_option( 'your_field_name' )`
- Replace normal order tags with `PWSMS()->replace_short_codes()`
- Replace your own custom tags with `pwoosms_order_sms_body_before_replace`
- Send SMS with `PWSMS()->send_sms( [ 'mobile' => ..., 'message' => ... ] )`
- For pattern gateways, pass a `pattern:CODE` style message

## Relevant plugin references

- `src/Settings/Settings.php:316`
- `src/Settings/Settings.php:348`
- `src/Settings/Settings.php:681`
- `src/Settings/Settings.php:707`
- `src/Helper.php:300`
- `src/Helper.php:585`
- `src/Helper.php:635`
- `src/Helper.php:1492`
- `src/Orders.php:159`
- `src/Orders.php:182`
