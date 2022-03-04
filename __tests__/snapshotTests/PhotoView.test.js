import React from 'react';
import PhotoView from '../../app/components/PhotoView';

import renderer from 'react-test-renderer';

it('PhotoView component renders correctly', done => {
    const tree = renderer.create(
        <PhotoView />
    ).toJSON();
    expect(tree).toMatchSnapshot();
    done();
});
