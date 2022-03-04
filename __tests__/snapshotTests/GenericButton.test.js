import React from 'react';
import GenericButton from '../../app/components/GenericButton';

import renderer from 'react-test-renderer';

it('GenericButton component renders correctly', (done) => {
    const tree = renderer.create(
        <GenericButton />
    ).toJSON();
    expect(tree).toMatchSnapshot();
    done();
});
