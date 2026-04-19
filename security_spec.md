# Security Specification: RMG Track Pro

## 1. Data Invariants
- `workers`: `worker_id` must be unique and alphanumeric.
- `inputs`: `quantity` must be positive. `cutting_no` is the primary anchor.
- `outputs`: `output_qty` must be positive.
- `zippers`/`labels`: `remaining_qty` must equal `input_qty - used_qty`.
- `threads`: `total_time` should be calculated server-side or validated.

## 2. Dirty Dozen Payloads (Rejection Targets)
1. **Empty Fields**: Creating a worker without a name.
2. **Invalid Types**: Setting `quantity` as a string.
3. **Negative Quantity**: Setting `output_qty` to -100.
4. **Id Poisoning**: Injecting a 2KB string as a `cutting_no`.
5. **Unauthorized Edit**: A non-logged-in user trying to update a record.
6. **Field Injection**: Adding `isAdmin: true` to a user profile (system doesn't have profiles yet but good practice).
7. **Bypassing Validations**: Updating `used_qty` in `zippers` without updating `remaining_qty` (if the client does the math).
8. **Invalid Date**: Passing a garbage string as a date.
9. **Size Mismatch**: Passing a size "XXXL" if not allowed.
10. **Huge Documents**: Sending a description that is 5MB.
11. **Spoofing Author**: Setting `author_id` to another user's UID.
12. **orphaned Records**: Creating an input for a non-existent PO (we don't have a PO Master yet, but we'll enforce string formats).

## 3. Test Runner
(I'll generate the rules now, and then the test runner if needed, but the priority is the rules).
