Feature: Registration

  Scenario: Register a new account
    Given I open the register page
    When I enter display name "Test User", email "test-{random}@example.com" and password "TestPass123!"
    And I submit the registration form
    Then I am redirected to the map

  Scenario: Duplicate email shows an error
    Given I open the register page
    When I enter display name "Test User", email "reviewer@coloursofsafety.com" and password "TestPass123!"
    And I submit the registration form
    Then I see an error

  Scenario: Short display name keeps the form open
    Given I open the register page
    When I enter display name "A", email "test@example.com" and password "TestPass123!"
    And I submit the registration form
    Then I am still on the register page

  Scenario: Short password keeps the form open
    Given I open the register page
    When I enter display name "Test User", email "test@example.com" and password "123"
    And I submit the registration form
    Then I am still on the register page
