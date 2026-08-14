Feature: My submissions

  Background:
    Given a new registered user

  Scenario: My submissions page loads
    Given I open my submissions page
    Then I see the heading "My submissions"
