/**
 *
 * CreateContent
 *
 */

import React from 'react';
import { FormattedMessage } from 'react-intl';

function CreateContent() {
  return (
    <FormattedMessage id="app.components.HomePage.createBlock.content.first">
      {message => (
        <p>
          {message}
          <FormattedMessage  id="app.components.HomePage.createBlock.content.contentTypeBuilder">
            { message => (<span style={{ fontStyle: 'italic', fontWeight: '500' }}>{message}</span>) }
          </FormattedMessage>
          <FormattedMessage id="app.components.HomePage.createBlock.content.second" />
          <FormattedMessage id="app.components.HomePage.createBlock.content.quickStart">
            { message => (<span style={{ fontStyle: 'italic', fontWeight: '500' }}>{message}</span>)}
          </FormattedMessage>
          <FormattedMessage id="app.components.HomePage.createBlock.content.tutorial" />
        </p>
      )}
    </FormattedMessage>
  );
}

export default CreateContent;
