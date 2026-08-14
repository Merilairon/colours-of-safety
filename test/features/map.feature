Feature: Map

  Scenario: Public map loads with legend
    Given I open the map page
    Then I see the map
    And I see the legend
    And I see the social proof counter

  Scenario: Guests see login hint
    Given I open the map page
    Then I see the guest hint

  Scenario: Filter map by category
    Given I open the map page
    When I filter by category "bar"
    Then I still see the map

  Scenario: Filter map by minimum safety
    Given I open the map page
    When I filter by minimum safety "Safe (3+)"
    Then I still see the map

  Scenario: Search for a location
    Given I open the map page
    When I search for "Brussels"
    Then I still see the map
