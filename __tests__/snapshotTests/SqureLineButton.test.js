import React from 'react';
import SqureLineButton from '../../app/components/SqureLineButton';

import renderer from 'react-test-renderer';

it('SqureLineButton component renders correctly', (done) => {
    const tree = renderer.create(
        <SqureLineButton />
    ).toJSON();
    expect(tree).toMatchSnapshot();
    done();
});
