const propsKeys = [
  'name',
  'fullname',
  'email',
  'address',
  'phoneNumber',
  'role',
  'gender',
  'createdAt',
  'updatedAt',
  'isVerified',
  'isActive',
  'isDeleted',
  'verificationToken',
  'tokenExpiration',
];

for (const key of propsKeys) {
  console.log(`get ${key}() {return this.props.${key};}`);
}
// run interactive script with:
//   npx ts-node scripts/generate-user-getters.ts
// Output:
// get name() {return this.props.name;}...
