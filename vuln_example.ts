import ObjectID from "@oneuptime/common/build/dist/Types/ObjectID";
import Email from "@oneuptime/common/build/dist/Types/Email";
import BadDataException from "@oneuptime/common/build/dist/Types/Exception/BadDataException";

const userId: ObjectID = ObjectID.generate();
console.log(`Generated user ID: ${userId.toString()}`);

const knownId: ObjectID = ObjectID.fromString(
  "550e8400-e29b-41d4-a716-446655440000"
);
console.log(`Known ID value: ${knownId.value}`);

try {
  const userEmail: Email = new Email("admin@juice-shop.example");
  console.log(`User email: ${userEmail.toString()}`);
  console.log(`Is business email: ${userEmail.isBusinessEmail()}`);
  console.log(`Email domain: ${userEmail.getEmailDomain().toString()}`);
} catch (err) {
  if (err instanceof BadDataException) {
    console.error(`Invalid email: ${err.message}`);
  }
}

const idA: ObjectID = new ObjectID("550e8400-e29b-41d4-a716-446655440000");
const idB: ObjectID = new ObjectID("550e8400-e29b-41d4-a716-446655440000");
console.log(`IDs equal: ${idA.equals(idB)}`);

const serialized = idA.toJSON();
const deserialized: ObjectID = ObjectID.fromJSON(serialized);
console.log(`Round-trip ID: ${deserialized.toString()}`);
