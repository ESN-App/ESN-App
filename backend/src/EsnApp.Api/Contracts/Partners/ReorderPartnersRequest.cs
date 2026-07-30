namespace EsnApp.Api.Contracts.Partners;

public record ReorderPartnersRequest(IReadOnlyList<Guid> PartnerIds);
