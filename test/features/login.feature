Feature: Login

  Scenario: Login page opens
    Given I open the login page
    Then I see the "Log in" heading

  Scenario: Invalid credentials show error
    Given I open the login page
    When I enter email "not-a-user@example.com" and password "wrong-password"
    And I submit the form
    Then I see an error message
