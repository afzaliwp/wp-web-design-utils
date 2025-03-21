/**
*  Allows you to add some custom classes to inputs and submit button of gravity forms
*/

<?php

namespace AfzaliWP\Includes;

defined( 'ABSPATH' ) || exit;

class Gravity_Forms {

	public function __construct() {
		// Use a single hook to modify the complete form HTML.
		add_filter( 'gform_shortcode_form', [ $this, 'capture_shortcode_atts' ], 10, 3 );
	}

	/**
	 * Capture the form HTML from Gravity Forms, inject custom classes directly into the markup,
	 * and return the modified HTML.
	 *
	 * @param string $shortcode_string The complete HTML output of the form.
	 * @param array $attributes The shortcode attributes.
	 * @param string $content Enclosed content (if any).
	 *
	 * @return string Modified HTML output.
	 */
	public function capture_shortcode_atts( $shortcode_string, $attributes, $content ) {
		$custom_atts = [
			'submit_classes'   => $attributes[ 'submit_classes' ] ?? '',
			'tel_classes'      => $attributes[ 'tel_classes' ] ?? '',
			'text_classes'     => $attributes[ 'text_classes' ] ?? '',
			'email_classes'    => $attributes[ 'email_classes' ] ?? '',
			'number_classes'   => $attributes[ 'number_classes' ] ?? '',
			'textarea_classes' => $attributes[ 'textarea_classes' ] ?? '',
			'select_classes'   => $attributes[ 'select_classes' ] ?? '',
		];

		if ( empty( trim( implode( ' ', $custom_atts ) ) ) ) {
			return $shortcode_string;
		}

		$wrapped_html = '<div id="gform-wrapper">' . $shortcode_string . '</div>';

		$dom = new \DOMDocument();
		libxml_use_internal_errors( true );
		// Use mb_convert_encoding to handle UTF-8 characters correctly.
		$dom->loadHTML( mb_convert_encoding( $wrapped_html, 'HTML-ENTITIES', 'UTF-8' ) );
		$xpath = new \DOMXPath( $dom );

		$input_map = [
			'text'   => 'text_classes',
			'email'  => 'email_classes',
			'number' => 'number_classes',
			'tel'    => 'tel_classes'
		];

		foreach ( $input_map as $input_type => $class_key ) {
			if ( ! empty( $custom_atts[ $class_key ] ) ) {
				// Find all input elements with the specified type.
				$nodes = $xpath->query( "//input[@type='{$input_type}']" );
				foreach ( $nodes as $node ) {
					$existing  = $node->getAttribute( 'class' );
					$new_class = trim( $custom_atts[ $class_key ] . ' ' . $existing );
					$node->setAttribute( 'class', $new_class );
				}
			}
		}

		// ---- Process <textarea> elements ----
		if ( ! empty( $custom_atts[ 'textarea_classes' ] ) ) {
			$nodes = $xpath->query( "//textarea" );
			foreach ( $nodes as $node ) {
				$existing  = $node->getAttribute( 'class' );
				$new_class = trim( $custom_atts[ 'textarea_classes' ] . ' ' . $existing );
				$node->setAttribute( 'class', $new_class );
			}
		}

		// ---- Process <select> elements ----
		if ( ! empty( $custom_atts[ 'select_classes' ] ) ) {
			$nodes = $xpath->query( "//select" );
			foreach ( $nodes as $node ) {
				$existing  = $node->getAttribute( 'class' );
				$new_class = trim( $custom_atts[ 'select_classes' ] . ' ' . $existing );
				$node->setAttribute( 'class', $new_class );
			}
		}

		if ( ! empty( $custom_atts[ 'submit_classes' ] ) ) {
			$nodes = $xpath->query( "//input[@type='submit']" );
			foreach ( $nodes as $node ) {
				$existing  = $node->getAttribute( 'class' );
				$new_class = trim( $custom_atts[ 'submit_classes' ] . ' ' . $existing );
				$node->setAttribute( 'class', $new_class );
			}

			$nodes = $xpath->query( "//button[@type='submit']" );
			foreach ( $nodes as $node ) {
				$existing  = $node->getAttribute( 'class' );
				$new_class = trim( $custom_atts[ 'submit_classes' ] . ' ' . $existing );
				$node->setAttribute( 'class', $new_class );
			}
		}

		// ---- Extract the modified HTML from our dummy container. ----
		$wrapper       = $dom->getElementById( 'gform-wrapper' );
		$modified_html = '';
		if ( $wrapper ) {
			foreach ( $wrapper->childNodes as $child ) {
				$modified_html .= $dom->saveHTML( $child );
			}
		}

		libxml_clear_errors();

		return $modified_html;
	}
}
