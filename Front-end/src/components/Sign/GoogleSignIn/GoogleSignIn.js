import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import classes from './GoogleSignIn.module.scss';
import { GOOGLE_CLIENT_ID } from '../../../config/config';
import { fetchGoogleAuth } from '../../../redux/actions/auth-actions';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

// Loads Google Identity Services once per page and resolves when the global is
// ready. Concurrent callers share the same promise, so mounting the button on
// both the sign-in and sign-up forms still yields a single network request.
let gsiPromise = null;
const loadGsi = () => {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (gsiPromise) return gsiPromise;

    gsiPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
        const script = existing || document.createElement('script');
        script.addEventListener('load', resolve);
        script.addEventListener('error', () => {
            gsiPromise = null;
            reject(new Error('Google Identity Services failed to load'));
        });
        if (!existing) {
            script.src = GSI_SRC;
            script.async = true;
            document.head.appendChild(script);
        }
    });
    return gsiPromise;
};

// Google's own sign-in button. Renders nothing when no client id is configured,
// so a deployment without a Google project simply falls back to email/password.
const GoogleSignIn = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const buttonRef = useRef(null);
    const [isUnavailable, setIsUnavailable] = useState(false);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) return undefined;

        let alive = true;

        loadGsi()
            .then(() => {
                if (!alive || !buttonRef.current) return;

                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: ({ credential }) => {
                        if (credential) dispatch(fetchGoogleAuth(credential, navigate));
                    },
                });

                // Google draws the button itself; re-rendering on a language change
                // keeps its label in the same language as the rest of the page.
                buttonRef.current.innerHTML = '';
                window.google.accounts.id.renderButton(buttonRef.current, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    shape: 'pill',
                    text: 'continue_with',
                    width: 280,
                    locale: i18n.language,
                });
            })
            .catch(() => {
                if (alive) setIsUnavailable(true);
            });

        return () => { alive = false; };
    }, [dispatch, navigate, i18n.language]);

    if (!GOOGLE_CLIENT_ID) return null;

    return (
        <div className={classes.googleBox}>
            <div className={classes.divider}><span>{t('sign.or')}</span></div>
            {isUnavailable
                ? <p className={classes.unavailable}>{t('sign.googleUnavailable')}</p>
                : <div ref={buttonRef} className={classes.button} />}
        </div>
    );
};

export default GoogleSignIn;
