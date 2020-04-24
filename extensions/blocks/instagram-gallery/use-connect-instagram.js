/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import PopupMonitor from 'lib/popup-monitor';

export default function useConnectInstagram( { accessToken, setAttributes, setImages } ) {
	const [ isConnecting, setIsConnecting ] = useState( false );

	useEffect( () => {
		if ( accessToken ) {
			return;
		}
		setIsConnecting( true );
		apiFetch( { path: `/wpcom/v2/instagram/access-token` } )
			.then( token => {
				setIsConnecting( false );
				if ( token ) {
					setAttributes( { accessToken: token } );
				}
			} )
			.catch( () => {
				setIsConnecting( false );
			} );
	}, [ accessToken, setAttributes, setIsConnecting ] );

	const connectToService = () => {
		setIsConnecting( true );
		apiFetch( { path: `/wpcom/v2/instagram/connect-url` } ).then( connectUrl => {
			const popupMonitor = new PopupMonitor();

			popupMonitor.open(
				connectUrl,
				`connect-to-instagram-popup`,
				'toolbar=0,location=0,menubar=0,' + popupMonitor.getScreenCenterSpecs( 700, 700 )
			);

			popupMonitor.on( 'message', ( { keyring_id } ) => {
				setIsConnecting( false );
				if ( keyring_id ) {
					setAttributes( { accessToken: keyring_id.toString() } );
				}
			} );

			popupMonitor.on( 'close', name => {
				if ( `connect-to-instagram-popup` === name ) {
					setIsConnecting( false );
				}
			} );
		} );
	};

	const disconnectFromService = token => {
		setIsConnecting( true );
		apiFetch( {
			path: addQueryArgs( `/wpcom/v2/instagram/delete-access-token`, {
				access_token: token,
			} ),
			method: 'DELETE',
		} ).then( responseCode => {
			setIsConnecting( false );
			if ( 200 === responseCode ) {
				setAttributes( { accessToken: undefined } );
				setImages( [] );
			}
		} );
	};

	return { isConnecting, connectToService, disconnectFromService };
}
