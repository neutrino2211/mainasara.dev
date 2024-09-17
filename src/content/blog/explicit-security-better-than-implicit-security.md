---
author: Mainasara Tsowa
pubDatetime: 2024-09-17T15:40:21.799Z
title: "Explicit Security Is Always Better Than Implicit Security"
featured: true
description: "A look at a common security misconception regarding application distribution and how it to avoid it"
tags:
  - reverseengineering
  - cysec
  - security
  - machinecode
  - analysis
  - reverse engineering
  - x86
---

Not all security is made equal. One might think that the following code is secure.

```c
#include <stdio.h>
#include <string.h>
int main() {
  char input[100];
  const char *secretCode = "OpenSesame"; // Expected input
  printf("Enter the vault code: ");
  scanf("%99s", input);  // Read user input, limit to 99 characters
  // Check if input matches the expected code
  if (strcmp(input, secretCode) == 0) {
    printf("Vault Opened\n");
  } else {
    printf("Incorrect code. Access Denied.\n");
  }
  return 0;
}
```

The proverbial vault being protected would only ever open when the correct passcode was provided. When the program is compiled and ran, it behaves as expected.

![Program behaving as expected](/assets/explicit-security/image.png)

This method of protecting the vault is what I like to call "Implicit Security". There are no lines of code dedicated to making the system impenetrable (No, "if" statements do not count).

Breaking this system is trivial, from inspecting strings within the binary to decompiling and inspecting the machine code.

But there is an even easier and permanent solution to this, but first we'd need to look at something.

### Machine Code Instructions

Machine code is the most low-level representation of a program, they are usually represented as bytes. These bytes are used by the computer's Instruction Set Architecture (ISA) to actually "execute" code via a complex set of physical electrical signals on the actual silicon.

*I won't be going into details on these topics but I encourage anyone interested in Reverse Engineering to look into them.*

There are many Machine code instructions but the important one today is the machine code for branch statements. Branch statements are instructions that control the flow of execution based on the result of comparisons, a.k.a The low-level representation of "if" statements.

Here are some that are relevant to this article.

![x86 branch statement instructions](/assets/explicit-security/image%20(1).png)

The one we are interested in is the "je" instruction which would be the low-level representation of what was written in the code.

```c
// ...
if (strcmp(input, secretCode) == 0) {
// ...
```

To bypass this check, we will need to change the "je" to a "jne" which would turn the above code into

```c
// ...
if (strcmp(input, secretCode) != 0) {
// ...
```

Which effectively means, if the password is incorrect, open the vault. With this information we can get into the next step.

### Directly Editing Machine Code

The machine code can be edited with any hex editor but it'll be a lot easier to do so with reverse engineering programs like [Cutter](https://cutter.re/).

The following disassembly shows the machine code of the relevant section where the passcode comparison is done.

*The "jne" below is the equality sign, gcc/clang seems to have made a few optimisations so in this case flipping from a "jne" to a "je" would be the way to do it*

![Disassembly of the bytecode](/assets/explicit-security/image%20(2).png)

To make the program do our bidding, we change the "jne"at 0x100003eeb to a "je" which makes the program "open the vault".

![Bytecode of "jne" changed to "je"](/assets/explicit-security/image%20(3).png)

After this change, the program is successfully broken.

![Program logic broken](/assets/explicit-security/image%20(4).png)

Don't worry, there's an easy way to fix this.

### Cryptographic Security

This is where cryptographic security comes in, the best way to secure such a system is to use cryptography in a pseudo-trustless system.

Instead of checking whether the passcode is correct, we could encrypt our data using a key and embed it into the application. This way, if someone enters the wrong key, the data is garbled and even if they edit the code, the data that is embedded is would still be garbled.

Let's get started on our function, it'll be a header file so we can include our encryption function in a more secure version of our application and we could also create a separate program to encrypt the data that would be embedded into out new application.

Here's our encryption function.

```c
char* xor_encrypt_decrypt(const char *plain_text, const char *key) {
    int text_length = strlen(plain_text);
    int key_length = strlen(key);
    
    // Allocate memory for the output
    char *output = (char*)malloc(text_length + 1);
    if (output == NULL) {
        return NULL; // Handle memory allocation failure
    }
    // Iterate and perform XOR while ensuring printable output
    for (int i = 0; i < text_length; i++) {
        char encrypted_char = plain_text[i] ^ key[i % key_length]; // Perform XOR
        output[i] = (encrypted_char % 95) + 32; // Map to printable range (32-126)
    }
    output[text_length] = '\0'; // Null-terminate the output string
    return output;
}
```

It takes input data and a key then performs performs an xor operation on every character in the input text.

When this is used to generate embeddable data, the resulting program could be made more secure.

![Generation of the embeddable data](/assets/explicit-security/image%20(5).png)

After embedding the encrypted data in our original application and only presenting the data based on xor calculations, we manage to get rid of the original problem of someone tampering with our program to get information out. Unless they provide the actual passcode.

![Our new, more secure program in action](/assets/explicit-security/image%20(6).png)

### Conclusion

Although the examples in this article are very rudimentary, the overall concept is the same. Securing applications does not just happen, it takes effort and deliberation to find what works best for your system/application/infrastructure.

### Afterword

Thanks for going through my article, these take a long time to conceptualise and present in a manner that effectively gets a point across. Please consider giving me a follow as I plan to make more of these in the future.

