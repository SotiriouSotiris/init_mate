# InitMate for Ruby

InitMate is a simple yet powerful VS Code extension for Ruby developers that helps you avoid forgetting to initialize method parameters as instance variables.

When working with methods like initialize, especially those with multiple parameters, it’s easy to forget to assign them to instance variables (e.g., @name = name). This extension automates that.

## Features

- **Add Instance Variable Assignments Automatically**:
  - Select the name of a method (or leave nothing selected to default to `initialize`).
  - Run the command `InitMate: Add Parameters`.
  - The extension will: locate the method, extract its parameters, add missing instance variables and avoid duplication.

---

## Examples

### Simple example:
Given a method like this:
```ruby
def initialize(name, age = 30)
end
```

The extension should update it to this:
```ruby
def initialize(name, age = 30)
  @name = name
  @age = age
end
```


### More complex example:
Given a method like this:
```ruby
def initialize(user, amount, currency: 'USD', gateway: :stripe, metadata = {}, debug: true)
    @user = user
    @currency = currency
end
```

The extension should update it to this:
```ruby
def initialize(user, amount, currency: 'USD', gateway: :stripe, metadata = {}, debug: true)
    @amount = amount
    @gateway = gateway
    @metadata = metadata
    @debug = debug
    @user = user
    @currency = currency
end
```
---

## Installation

Search for InitMate in the Extensions panel in VS Code and install it.

## License

This extension is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.