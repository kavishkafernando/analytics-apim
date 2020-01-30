/*
 *  Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */

import React from 'react';
import Moment from 'moment';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import ApiIcon from './ApiIcon';

/**
 * React Component for APIM Total Request Count widget body
 * @param {any} props @inheritDoc
 * @returns {ReactElement} Render the APIM Total Request Count widget body
 */
export default function APIMTotalRequestCount(props) {
    const {
        themeName, totalCount, timeFrom, timeTo,
    } = props;
    const styles = {
        headingWrapper: {
            height: '10%',
            margin: 'auto',
            paddingTop: '15px',
            width: '90%',
        },
        iconWrapper: {
            float: 'left',
            width: '40%',
            height: '62%',
        },
        icon: {
            display: 'block',
            margin: 'auto',
            marginTop: '25%',
        },
        dataWrapper: {
            float: 'left',
            width: '60%',
            height: '50%',
            paddingTop: '8%',
        },
        reqcount: {
            margin: 0,
            marginTop: '5%',
            color: 'rgb(135,205,223)',
            letterSpacing: 1,
            fontSize: '80%',
        },
        typeText: {
            textAlign: 'left',
            fontWeight: 'normal',
            margin: 0,
            display: 'inline',
            marginLeft: '3%',
            letterSpacing: 1.5,
            fontSize: 'small',
        },
        playIcon: {
            position: 'absolute',
            bottom: '13%',
            right: '8%',
        },
        h3: {
            borderBottom: themeName === 'dark' ? '1.5px solid #fff' : '2px solid #2571a7',
            paddingBottom: '10px',
            margin: 'auto',
            textAlign: 'left',
            fontWeight: 'normal',
            letterSpacing: 1.5,
        },
        h1: {
            margin: 'auto',
            textAlign: 'center',
            fontSize: '300%',
            display: 'inline',
            color: themeName === 'dark' ? '#fff' : '#2571a7',
        },
    };

    return (
        <div
            style={{
                background: themeName === 'dark'
                    ? 'linear-gradient(to right, rgb(4, 31, 51) 0%, rgb(37, 113, 167) 46%, rgb(42, 71, 101) 100%'
                    : '#fff',
                width: '90%',
                height: '85%',
                margin: '5% 5%',
            }}
        >
            <div style={styles.headingWrapper}>
                <h3 style={styles.h3}>
                    <FormattedMessage
                        id='widget.heading'
                        defaultMessage='TOTAL REQUEST COUNT'
                    />
                </h3>
            </div>
            <div style={styles.iconWrapper}>
                <ApiIcon
                    strokeColor={themeName === 'dark' ? '#fff' : '#2571a7'}
                    width='50%'
                    height='50%'
                    style={styles.icon}
                />
            </div>
            <div style={styles.dataWrapper}>
                <h1 style={styles.h1}>
                    {totalCount}
                </h1>
                <h3 style={styles.typeText}>
                    {totalCount === '01'
                        ? (
                            <FormattedMessage
                                id='request'
                                defaultMessage='HIT'
                            />
                        )
                        : (
                            <FormattedMessage
                                id='requests'
                                defaultMessage='HITS'
                            />
                        ) }
                </h3>
                <p style={styles.reqcount}>
                    [
                    {' '}
                    {totalCount}
                    {' '}
                    {totalCount === '01'
                        ? (
                            <FormattedMessage
                                id='request'
                                defaultMessage='HIT'
                            />
                        )
                        : (
                            <FormattedMessage
                                id='requests'
                                defaultMessage='HITS'
                            />
                        ) }
                    {' '}
                    {<FormattedMessage
                        id='within.text'
                        defaultMessage='WITHIN'
                    />}
                    {' '}
                    {Moment(timeFrom).format('YYYY-MMM')}
                    {' '}
                    {<FormattedMessage
                        id='to.text'
                        defaultMessage='TO'
                    />}
                    {' '}
                    {Moment(timeTo).format('YYYY-MMM')}
                    {' '}
                    ]
                </p>
            </div>
        </div>
    );
}

APIMTotalRequestCount.propTypes = {
    themeName: PropTypes.string.isRequired,
    totalCount: PropTypes.string.isRequired,
    timeFrom: PropTypes.number.isRequired,
    timeTo: PropTypes.number.isRequired,
};
