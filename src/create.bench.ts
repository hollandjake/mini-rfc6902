import { bench } from 'vitest';
import { create } from './create';
import { Patch } from './patch';
import { Pointer } from './pointer';
import { Diffable, DiffOpts, WithSkip } from './utils';

const a = {
  _id: '67c841f610a0ba30417bea1b',
  index: 0,
  guid: '7341bf91-80ee-41ad-a85b-fbf7a7270a57',
  isActive: true,
  balance: '$2,032.03',
  picture: 'http://placehold.it/32x32',
  age: 23,
  eyeColor: 'green',
  name: 'Hall Robbins',
  gender: 'male',
  company: 'EARTHPURE',
  email: 'hallrobbins@earthpure.com',
  phone: '+1 (895) 449-3691',
  address: '766 Church Lane, Cumminsville, South Dakota, 2008',
  about:
    'Enim ullamco incididunt qui incididunt consectetur ipsum mollit laboris. Quis occaecat velit Lorem non veniam sunt aliquip. Dolore anim ea nostrud fugiat. Consectetur ipsum incididunt dolor reprehenderit aliquip sit ex incididunt enim. Anim eu eu ullamco ullamco quis quis officia sunt est aute ad duis laborum.\r\n',
  registered: '2018-10-28T10:26:14 -00:00',
  latitude: -42.201949,
  longitude: -138.487852,
  tags: ['non', 'in', 'aliquip', 'quis', 'fugiat', 'eu', 'aliquip'],
  friends: [
    {
      id: 0,
      name: 'Margarita Black',
    },
  ],
  greeting: 'Hello, Hall Robbins! You have 3 unread messages.',
  favoriteFruit: 'strawberry',
};
const b = {
  _id: '67c841f6e8fc79616a72b233',
  index: 1,
  guid: '4b9e1345-2f78-4a9f-b2af-9221b933e1b2',
  isActive: false,
  balance: '$3,434.65',
  picture: 'http://placehold.it/32x32',
  age: 38,
  eyeColor: 'brown',
  name: 'Prince Meadows',
  gender: 'male',
  company: 'KOOGLE',
  email: 'princemeadows@koogle.com',
  phone: '+1 (822) 478-2474',
  address: '790 Preston Court, Aberdeen, Virgin Islands, 2482',
  about:
    'Cupidatat in sit dolor enim sunt id Lorem. Nisi proident culpa ullamco amet pariatur velit laboris. Proident excepteur consequat qui ex nisi velit ea labore ipsum exercitation ullamco officia cillum. Reprehenderit laboris aliquip cillum exercitation laboris mollit aliqua pariatur culpa occaecat.\r\n',
  registered: '2018-03-15T10:33:32 -00:00',
  latitude: -42.279434,
  longitude: 101.407668,
  tags: ['aliqua', 'magna', 'esse', 'mollit', 'commodo', 'qui', 'nisi'],
  friends: [
    {
      id: 0,
      name: 'Lillie Tucker',
    },
    {
      id: 1,
      name: 'Maxwell Gibson',
    },
    {
      id: 2,
      name: 'Anna Jefferson',
    },
    {
      id: 3,
      name: 'Nolan Romero',
    },
    {
      id: 4,
      name: 'Billie Lang',
    },
  ],
  greeting: 'Hello, Prince Meadows! You have 6 unread messages.',
  favoriteFruit: 'apple',
};

bench('create - default', () => {
  create(a, b);
});

bench('create - maxi', () => {
  create(a, b, { transform: 'maximize' });
});

bench('create - mini', () => {
  create(a, b, { transform: 'minify' });
});

bench('create - binary', () => {
  create(a, b, { transform: 'serialize' });
});

bench('create - custom', () => {
  create(a, b, {
    diff: (_, o, p) => {
      // example force all to be removed and added (effectively a replacement)
      return [
        ['-', p],
        ['+', p, o],
      ];
    },
  });
});

class SomeClass implements Diffable {
  constructor(readonly data: object) {}

  diff(output: object, ptr: Pointer, opts: WithSkip<DiffOpts>): Patch {
    if (!(output instanceof SomeClass)) opts.skip();
    // As an example, just replace the object
    return [['~', ptr, output]];
  }
}

const X = new SomeClass(a);
const Y = new SomeClass(b);
bench('create - object with own diff function', () => {
  create(X, Y);
});
